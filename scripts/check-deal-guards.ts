// Server-side authorization checks for the deal lifecycle.
//
// The UI hides actions you are not allowed to take, but hiding a form is not a
// security control — a server action is a public endpoint. This exercises the
// domain layer directly, the way a forged request would reach it.
//
// The script builds its own deals, drives them to the states it needs, and
// deletes them at the end, so it can be run repeatedly and does not depend on
// whatever happens to be in the database.
//
//   npm run test:guards
import "dotenv/config";
import assert from "node:assert/strict";

import { prisma } from "../src/lib/prisma";
import {
  approveDelivery,
  cancelDeal,
  confirmClaimed,
  confirmPaymentReceived,
  createDeal,
  depositCredentials,
  joinDealByCode,
  loadDealForViewer,
  markPayoutSent,
  refundDeal,
  revealCredentialsToAdmin,
  revealCredentialsToBuyer,
  submitPayment,
} from "../src/lib/deals";
import { listMessages, postMessage } from "../src/lib/messages";
import { getReputation, leaveReview } from "../src/lib/reviews";
import { openDispute, resolveDispute, withdrawDispute } from "../src/lib/disputes";
import { banUser, forceCancel, forceRefundCompleted, unbanUser } from "../src/lib/admin";
import type { CurrentUser } from "../src/lib/dal";

let passed = 0;
function ok(label: string) {
  passed++;
  console.log(`  PASS  ${label}`);
}

async function userByEmail(email: string): Promise<CurrentUser> {
  return prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
}

const CREDS = {
  loginEmail: "guard-fixture@example.com",
  loginPassword: "guard-fixture-pw",
  recoveryEmail: "",
  recoveryEmailPassword: "",
  notes: "",
};

const ATTACK_CREDS = {
  loginEmail: "attacker@example.com",
  loginPassword: "attacker-pw",
  recoveryEmail: "",
  recoveryEmailPassword: "",
  notes: "",
};

/** Deals this run created, removed in the finally block. */
const fixtureIds: string[] = [];
/** Users this run created, likewise. */
const fixtureUserIds: string[] = [];

/** Builds a deal and walks it to the requested stage. */
async function makeDeal(
  seller: CurrentUser,
  buyer: CurrentUser,
  admin: CurrentUser,
  upTo: "awaiting_payment" | "payment_submitted" | "credentials_released" | "settled",
): Promise<string> {
  const created = await createDeal({
    creator: seller,
    side: "seller",
    accountSummary: "GUARD FIXTURE — created by npm run test:guards, safe to delete.",
    game: "eFootball",
    platform: null,
    level: null,
    agreedPriceCents: 10_000,
  });

  if (!created.ok) throw new Error(`fixture setup failed: ${created.error}`);

  fixtureIds.push(created.dealId);

  const joined = await joinDealByCode(buyer, created.inviteCode);
  if (!joined.ok) throw new Error(`fixture join failed: ${joined.error}`);

  const deposited = await depositCredentials(seller, created.dealId, CREDS);
  if (!deposited.ok) throw new Error(`fixture deposit failed: ${deposited.error}`);

  if (upTo === "awaiting_payment") return created.dealId;

  const paid = await submitPayment(buyer, created.dealId, {
    method: "crypto",
    txHash: "0xfixture",
    reference: null,
    instructionsSnapshot: "fixture",
  });
  if (!paid.ok) throw new Error(`fixture payment failed: ${paid.error}`);

  if (upTo === "payment_submitted") return created.dealId;

  const confirmed = await confirmPaymentReceived(admin, created.dealId);
  if (!confirmed.ok) throw new Error(`fixture confirm failed: ${confirmed.error}`);

  const released = await approveDelivery(admin, created.dealId);
  if (!released.ok) throw new Error(`fixture release failed: ${released.error}`);

  if (upTo === "credentials_released") return created.dealId;

  const claimed = await confirmClaimed(buyer, created.dealId);
  if (!claimed.ok) throw new Error(`fixture claim failed: ${claimed.error}`);

  const paidOut = await markPayoutSent(admin, created.dealId, "fixture-payout");
  if (!paidOut.ok) throw new Error(`fixture payout failed: ${paidOut.error}`);

  return created.dealId;
}

async function main() {
  const sami = await userByEmail("sami@pesescrow.test");
  const karim = await userByEmail("karim@pesescrow.test");
  const yassine = await userByEmail("yassine@pesescrow.test");
  const admin = await userByEmail("admin@pesescrow.test");

  console.log("Building fixture deals…\n");

  const awaitingPayment = await makeDeal(sami, karim, admin, "awaiting_payment");
  const paymentSubmitted = await makeDeal(sami, karim, admin, "payment_submitted");
  const releasedDeal = await makeDeal(sami, karim, admin, "credentials_released");
  const settledDeal = await makeDeal(sami, karim, admin, "settled");

  // -------------------------------------------------------------------------
  // Phase 2: who may act on a deal
  // -------------------------------------------------------------------------

  const buyerDeposit = await depositCredentials(karim, awaitingPayment, ATTACK_CREDS);
  assert.equal(buyerDeposit.ok, false);
  assert.match((buyerDeposit as { error: string }).error, /Only the seller/i);
  ok("the buyer cannot deposit credentials");

  assert.equal((await depositCredentials(yassine, awaitingPayment, ATTACK_CREDS)).ok, false);
  ok("an unrelated user cannot deposit credentials");

  assert.equal((await depositCredentials(admin, awaitingPayment, ATTACK_CREDS)).ok, false);
  ok("even the admin cannot deposit on the seller's behalf");

  const stored = await prisma.credential.findUniqueOrThrow({
    where: { dealId: awaitingPayment },
    select: { ciphertext: true },
  });
  assert.ok(!stored.ciphertext.includes("attacker"));
  ok("the stored account was not overwritten by the rejected attempts");

  // Once money is in, the account is frozen — swapping it after someone pays is
  // the exact scam this service exists to prevent.
  const lateSwap = await depositCredentials(sami, paymentSubmitted, ATTACK_CREDS);
  assert.equal(lateSwap.ok, false);
  assert.match((lateSwap as { error: string }).error, /no longer be changed/i);
  ok("the seller cannot swap the account after payment is submitted");

  assert.equal((await cancelDeal(yassine, awaitingPayment)).ok, false);
  ok("a non-party cannot cancel a deal");

  const paidCancel = await cancelDeal(sami, paymentSubmitted);
  assert.equal(paidCancel.ok, false);
  assert.match((paidCancel as { error: string }).error, /dispute/i);
  ok("a deal with money in it cannot be cancelled, only disputed");

  assert.equal((await joinDealByCode(yassine, "definitely-not-a-real-code")).ok, false);
  ok("a bogus invite code is refused");

  // A fresh invite, to prove the creator cannot take both sides.
  const selfJoinFixture = await createDeal({
    creator: sami,
    side: "seller",
    accountSummary: "GUARD FIXTURE — self-join check, safe to delete.",
    game: "eFootball",
    platform: null,
    level: null,
    agreedPriceCents: 5_000,
  });

  if (!selfJoinFixture.ok) throw new Error("fixture setup failed");
  fixtureIds.push(selfJoinFixture.dealId);

  const selfJoin = await joinDealByCode(sami, selfJoinFixture.inviteCode);
  assert.equal(selfJoin.ok, false);
  assert.match((selfJoin as { error: string }).error, /your own deal/i);
  ok("the creator cannot join their own deal as the other side");

  assert.equal(await loadDealForViewer(awaitingPayment, yassine), null);
  ok("a non-party cannot load the deal at all");

  const asBuyer = await loadDealForViewer(awaitingPayment, karim);
  assert.equal(asBuyer?.role, "buyer");
  assert.equal(asBuyer?.deal.hasCredentials, true);
  assert.equal("ciphertext" in (asBuyer?.deal ?? {}), false);
  assert.equal("deliveredCiphertext" in (asBuyer?.deal ?? {}), false);
  assert.equal(asBuyer?.deal.inviteCode, null);
  ok("the buyer sees the deal but no credential data and no invite code");

  const asAdmin = await loadDealForViewer(awaitingPayment, admin);
  assert.equal(asAdmin?.role, "admin");
  assert.equal(asAdmin?.deal.inviteCode, null);
  ok("the admin can read the deal but is not handed the invite code");

  // -------------------------------------------------------------------------
  // Phase 3: the money and the release
  // -------------------------------------------------------------------------

  // These are the actions where getting authorization wrong costs real money.
  const adminOnly = [
    ["confirm a payment", () => confirmPaymentReceived(karim, paymentSubmitted)],
    ["approve delivery", () => approveDelivery(karim, paymentSubmitted)],
    ["refund a deal", () => refundDeal(karim, paymentSubmitted)],
    ["read credentials for verification", () => revealCredentialsToAdmin(karim, paymentSubmitted)],
    ["mark a payout as sent", () => markPayoutSent(karim, settledDeal, "fake")],
  ] as const;

  for (const [what, run] of adminOnly) {
    const result = await run();
    assert.equal(result.ok, false, `${what} must be refused for a non-admin`);
    assert.match((result as { error: string }).error, /Admins only/i);
  }
  ok("a normal user cannot confirm payment, release, refund, read credentials or pay out");

  const sellerPays = await submitPayment(sami, awaitingPayment, {
    method: "crypto",
    txHash: "0xdeadbeef",
    reference: null,
    instructionsSnapshot: "forged",
  });
  assert.equal(sellerPays.ok, false);
  assert.match((sellerPays as { error: string }).error, /Only the buyer/i);
  ok("the seller cannot submit payment on the buyer's behalf");

  // Releasing before the money is confirmed would hand over the account for free.
  const earlyRelease = await approveDelivery(admin, paymentSubmitted);
  assert.equal(earlyRelease.ok, false);
  assert.match((earlyRelease as { error: string }).error, /not ready for delivery approval/i);
  ok("delivery cannot be approved while the payment is still unconfirmed");

  const sellerReads = await revealCredentialsToBuyer(sami, releasedDeal);
  assert.equal(sellerReads.ok, false);
  ok("the seller cannot read credentials through the buyer's route");

  assert.equal((await confirmClaimed(yassine, releasedDeal)).ok, false);
  ok("a non-buyer cannot confirm the claim");

  // The one case that must work: the real buyer reading a released account.
  const allowed = await revealCredentialsToBuyer(karim, releasedDeal);
  assert.equal(allowed.ok, true);
  assert.equal(
    (allowed as { credentials: { loginEmail: string } }).credentials.loginEmail,
    CREDS.loginEmail,
  );
  ok("the buyer of a released deal can read the account details");

  // Reading it must not be reversible into a second payout or a reopened deal.
  const doublePay = await markPayoutSent(admin, settledDeal, "second-attempt");
  assert.equal(doublePay.ok, false);
  assert.match((doublePay as { error: string }).error, /awaiting payout/i);
  ok("a payout cannot be recorded twice on the same deal");

  assert.equal((await confirmClaimed(karim, settledDeal)).ok, false);
  ok("a completed deal cannot be confirmed again");

  assert.equal((await refundDeal(admin, settledDeal)).ok, false);
  ok("a settled deal cannot be refunded after payout");

  // -------------------------------------------------------------------------
  // Phase 4: chat, reviews, disputes
  // -------------------------------------------------------------------------

  // Chat is for the two parties and the admin, nobody else.
  assert.equal((await postMessage(yassine, awaitingPayment, "let me in")).ok, false);
  assert.equal(await listMessages(awaitingPayment, yassine), null);
  ok("an outsider can neither read nor post in a deal's chat");

  assert.equal((await postMessage(sami, awaitingPayment, "hello from the seller")).ok, true);
  assert.equal((await postMessage(karim, awaitingPayment, "hello from the buyer")).ok, true);
  ok("both parties can post in the chat");

  // Admin notes: written by the admin, invisible to everyone else. This is the
  // one place a leak would expose the admin's private reasoning.
  assert.equal(
    (await postMessage(sami, awaitingPayment, "sneaky internal note", true)).ok,
    false,
    "a party must not be able to write an admin note",
  );
  ok("a party cannot write an admin-only note");

  assert.equal((await postMessage(admin, awaitingPayment, "internal: watch this one", true)).ok, true);

  const sellerSees = await listMessages(awaitingPayment, sami);
  const buyerSees = await listMessages(awaitingPayment, karim);
  const adminSees = await listMessages(awaitingPayment, admin);

  assert.ok(sellerSees && buyerSees && adminSees);
  assert.equal(sellerSees.some((m) => m.isAdminNote), false);
  assert.equal(buyerSees.some((m) => m.isAdminNote), false);
  assert.equal(adminSees.some((m) => m.isAdminNote), true);
  // Not merely hidden — the note must not be in the payload at all.
  assert.equal(
    JSON.stringify(sellerSees).includes("watch this one"),
    false,
    "admin note text must never reach a party",
  );
  ok("admin notes are absent from what the parties receive, not just hidden");

  assert.equal((await postMessage(sami, awaitingPayment, "   ")).ok, false);
  ok("an empty message is refused");

  // Reviews: buyer only, completed deals only, once.
  assert.equal((await leaveReview(karim, awaitingPayment, 5, "too early")).ok, false);
  ok("a deal cannot be reviewed before it completes");

  assert.equal((await leaveReview(yassine, settledDeal, 5, null)).ok, false);
  ok("an outsider cannot review a deal");

  assert.equal((await leaveReview(karim, settledDeal, 9, null)).ok, false);
  assert.equal((await leaveReview(karim, settledDeal, 0, null)).ok, false);
  ok("a rating outside 1-5 is refused");

  assert.equal((await leaveReview(karim, settledDeal, 5, "went perfectly")).ok, true);
  assert.equal((await leaveReview(karim, settledDeal, 1, "changed my mind")).ok, false);
  ok("the buyer can review once, and only once");

  // Reviews are mutual, so the seller reviews too — of the buyer, never of
  // themselves. Nobody can review themselves because the subject is always
  // derived from the opposite side rather than supplied by the caller.
  assert.equal((await leaveReview(sami, settledDeal, 4, "paid promptly")).ok, true);
  assert.equal((await leaveReview(sami, settledDeal, 1, "second thoughts")).ok, false);
  ok("the seller can also review once, rating the buyer");

  const settledReviews = await prisma.review.findMany({
    where: { dealId: settledDeal },
    select: { authorId: true, subjectId: true, subjectSide: true },
  });
  assert.equal(settledReviews.length, 2);
  for (const review of settledReviews) {
    assert.notEqual(review.authorId, review.subjectId, "nobody may review themselves");
  }
  assert.deepEqual(settledReviews.map((r) => r.subjectSide).sort(), ["buyer", "seller"]);
  ok("each deal ends with one review of the seller and one of the buyer");

  const samiRep = await getReputation(sami.id);
  assert.ok(samiRep.count >= 1);
  assert.ok(samiRep.average !== null && samiRep.average >= 1 && samiRep.average <= 5);
  assert.ok(samiRep.asSeller.count >= 1, "seller-side rating should be counted separately");
  ok("reputation reflects the review that was left, split by side");

  const karimRep = await getReputation(karim.id);
  assert.ok(karimRep.asBuyer.count >= 1, "a buyer accumulates their own record");
  ok("a buyer builds a reputation too");

  // Disputes: parties only, and only once money is involved.
  assert.equal((await openDispute(yassine, releasedDeal, "x", "not my deal at all")).ok, false);
  ok("an outsider cannot open a dispute");

  const tooEarly = await openDispute(karim, awaitingPayment, "x", "nothing has happened yet here");
  assert.equal(tooEarly.ok, false);
  assert.match((tooEarly as { error: string }).error, /cancel the deal instead/i);
  ok("a deal with no money in it cannot be disputed, only cancelled");

  assert.equal(
    (await openDispute(karim, settledDeal, "x", "this deal is long since settled")).ok,
    false,
  );
  ok("a settled deal cannot be disputed");

  const opened = await openDispute(karim, releasedDeal, "Account does not work", "The login is rejected every time I try it.");
  assert.equal(opened.ok, true);

  const frozen = await prisma.deal.findUniqueOrThrow({
    where: { id: releasedDeal },
    select: { status: true, preDisputeStatus: true },
  });
  assert.equal(frozen.status, "disputed");
  assert.equal(frozen.preDisputeStatus, "claiming");
  ok("opening a dispute freezes the deal and remembers where it was");

  assert.equal((await openDispute(sami, releasedDeal, "y", "trying to double dispute this")).ok, false);
  ok("a second dispute cannot be opened on the same deal");

  assert.equal((await resolveDispute(karim, releasedDeal, "buyer", "I decide for myself")).ok, false);
  ok("a party cannot resolve their own dispute");

  assert.equal((await withdrawDispute(sami, releasedDeal)).ok, false);
  ok("only the person who opened a dispute can withdraw it");

  // Withdrawing puts the deal back exactly where it was.
  assert.equal((await withdrawDispute(karim, releasedDeal)).ok, true);
  const restored = await prisma.deal.findUniqueOrThrow({
    where: { id: releasedDeal },
    select: { status: true, preDisputeStatus: true },
  });
  assert.equal(restored.status, "claiming");
  assert.equal(restored.preDisputeStatus, null);
  ok("withdrawing a dispute restores the previous status");

  // And an admin resolution moves the money the right way.
  assert.equal((await openDispute(karim, releasedDeal, "Still broken", "It genuinely does not work.")).ok, true);
  assert.equal((await resolveDispute(admin, releasedDeal, "buyer", "Credentials confirmed dead.")).ok, true);
  const refunded = await prisma.deal.findUniqueOrThrow({
    where: { id: releasedDeal },
    select: { status: true, refundedAt: true },
  });
  assert.equal(refunded.status, "refunded");
  assert.ok(refunded.refundedAt !== null);
  ok("resolving for the buyer refunds and closes the deal");

  // -------------------------------------------------------------------------
  // Phase 5: admin powers
  // -------------------------------------------------------------------------

  assert.equal((await banUser(karim, yassine.id, "because I feel like it")).ok, false);
  ok("a normal user cannot ban anyone");

  // Locking yourself out of the console would be unrecoverable through the UI.
  const banSelf = await banUser(admin, admin.id, "testing");
  assert.equal(banSelf.ok, false);
  assert.match((banSelf as { error: string }).error, /cannot ban yourself/i);
  ok("an admin cannot ban themselves");

  // One compromised admin account must not be able to remove the others.
  const otherAdmin = await prisma.user.create({
    data: {
      email: `guard-admin-${Date.now()}@example.test`,
      displayName: "Guard Fixture Admin",
      passwordHash: "not-a-real-hash",
      role: "admin",
    },
    select: { id: true },
  });
  fixtureUserIds.push(otherAdmin.id);

  const banAdmin = await banUser(admin, otherAdmin.id, "testing");
  assert.equal(banAdmin.ok, false);
  assert.match((banAdmin as { error: string }).error, /Admins cannot be banned/i);
  ok("an admin cannot ban another admin");

  assert.equal((await banUser(admin, yassine.id, "")).ok, false);
  ok("banning requires a reason");

  assert.equal((await banUser(admin, yassine.id, "Repeated chargebacks after claiming.")).ok, true);
  const banned = await prisma.user.findUniqueOrThrow({
    where: { id: yassine.id },
    select: { isBanned: true, banReason: true, bannedAt: true },
  });
  assert.equal(banned.isBanned, true);
  assert.ok(banned.banReason && banned.bannedAt);
  ok("banning records the reason and the time");

  assert.equal((await banUser(admin, yassine.id, "again")).ok, false);
  ok("an already-banned user cannot be banned twice");

  assert.equal((await unbanUser(karim, yassine.id)).ok, false);
  assert.equal((await unbanUser(admin, yassine.id)).ok, true);
  assert.equal((await unbanUser(admin, yassine.id)).ok, false);
  const restoredUser = await prisma.user.findUniqueOrThrow({
    where: { id: yassine.id },
    select: { isBanned: true, banReason: true },
  });
  assert.equal(restoredUser.isBanned, false);
  assert.equal(restoredUser.banReason, null);
  ok("only an admin can unban, and unbanning clears the reason");

  // Force actions.
  assert.equal((await forceRefundCompleted(karim, settledDeal)).ok, false);
  ok("a normal user cannot force-refund");

  // The payout has already gone out on settledDeal, so the money is genuinely
  // gone and there is nothing to reverse.
  const tooLate = await forceRefundCompleted(admin, settledDeal);
  assert.equal(tooLate.ok, false);
  assert.match((tooLate as { error: string }).error, /not been paid out/i);
  ok("a deal that has already been paid out cannot be force-refunded");

  // A completed deal with no payout yet can be reversed.
  const reversible = await makeDeal(sami, karim, admin, "credentials_released");
  await confirmClaimed(karim, reversible);
  assert.equal((await forceRefundCompleted(admin, reversible)).ok, true);
  const reversed = await prisma.deal.findUniqueOrThrow({
    where: { id: reversible },
    select: { status: true, refundedAt: true },
  });
  assert.equal(reversed.status, "refunded");
  assert.ok(reversed.refundedAt !== null);
  ok("a completed deal can be force-refunded before payout");

  assert.equal((await forceCancel(karim, awaitingPayment)).ok, false);
  ok("a normal user cannot force-cancel");

  assert.equal((await forceCancel(admin, paymentSubmitted)).ok, false);
  ok("a deal with money in it cannot be force-cancelled");

  assert.equal((await forceCancel(admin, awaitingPayment)).ok, true);
  ok("a stalled pre-payment deal can be force-cancelled");

  console.log(`\n${passed} guard checks passed.`);
}

main()
  .catch((error) => {
    console.error("\nGuard check FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (fixtureIds.length > 0) {
      // Credentials, messages, reviews and disputes cascade with the deal.
      await prisma.deal.deleteMany({ where: { id: { in: fixtureIds } } });
      console.log(`\nCleaned up ${fixtureIds.length} fixture deal(s).`);
    }

    if (fixtureUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: fixtureUserIds } } });
      console.log(`Cleaned up ${fixtureUserIds.length} fixture user(s).`);
    }

    await prisma.$disconnect();
  });
