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
  revealDeliveredCredentials,
  submitPayment,
} from "../src/lib/deals";
import { listMessages, postMessage } from "../src/lib/messages";
import { getReputation, leaveReview } from "../src/lib/reviews";
import { openDispute, resolveDispute, withdrawDispute } from "../src/lib/disputes";
import { banUser, forceCancel, forceRefundCompleted, unbanUser } from "../src/lib/admin";
import {
  listTransferCodes,
  provideTransferCode,
  requestTransferCode,
  sendTransferCode,
} from "../src/lib/transfer-codes";
import {
  destinationFields,
  getBalance,
  markWithdrawalSent,
  rejectWithdrawal,
  requestWithdrawal,
  MINIMUM_WITHDRAWAL_CENTS,
  needsTestTransfer,
  recordTestTransfer,
  confirmTestTransfer,
} from "../src/lib/wallet";
import { hashPassword } from "../src/lib/passwords";
import { generateDealReference, generateInviteCode, generateReferralCode } from "../src/lib/ids";
import {
  creditReferralsForDeal,
  reconcileReferralCredits,
  REFERRAL_REWARD_CENTS,
} from "../src/lib/referrals";
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

/**
 * Builds a CASH deal and walks it to the requested stage.
 *
 * The row is written directly rather than through createDeal(), because
 * createDeal only makes swaps now — there is no supported route to a cash deal
 * any more. The guards below still matter: the payment, refund and payout code
 * paths are all still in the codebase and still reachable for the deals that
 * were closed under that flow, so they are still worth proving nobody can walk
 * around. What is no longer tested here is *creating* one, which is correct,
 * because nobody can.
 */
async function makeDeal(
  seller: CurrentUser,
  buyer: CurrentUser,
  admin: CurrentUser,
  upTo: "awaiting_payment" | "payment_submitted" | "credentials_released" | "settled",
): Promise<string> {
  const inviteCode = generateInviteCode();

  const created = await prisma.deal.create({
    data: {
      reference: generateDealReference(),
      inviteCode,
      createdById: seller.id,
      createdSide: "seller",
      sellerId: seller.id,
      accountSummary: "GUARD FIXTURE — created by npm run test:guards, safe to delete.",
      game: "eFootball",
      tradeKind: "cash",
      agreedPriceCents: 10_000,
      feeBps: 500,
      feeCents: 500,
      sellerPayoutCents: 9_500,
      status: "awaiting_counterparty",
    },
    select: { id: true },
  });

  fixtureIds.push(created.id);

  const joined = await joinDealByCode(buyer, inviteCode);
  if (!joined.ok) throw new Error(`fixture join failed: ${joined.error}`);

  const deposited = await depositCredentials(seller, created.id, CREDS);
  if (!deposited.ok) throw new Error(`fixture deposit failed: ${deposited.error}`);

  if (upTo === "awaiting_payment") return created.id;

  const paid = await submitPayment(buyer, created.id, {
    method: "crypto",
    txHash: "0xfixture",
    reference: null,
    instructionsSnapshot: "fixture",
  });
  if (!paid.ok) throw new Error(`fixture payment failed: ${paid.error}`);

  if (upTo === "payment_submitted") return created.id;

  const confirmed = await confirmPaymentReceived(admin, created.id);
  if (!confirmed.ok) throw new Error(`fixture confirm failed: ${confirmed.error}`);

  const released = await approveDelivery(admin, created.id);
  if (!released.ok) throw new Error(`fixture release failed: ${released.error}`);

  if (upTo === "credentials_released") return created.id;

  const claimed = await confirmClaimed(buyer, created.id);
  if (!claimed.ok) throw new Error(`fixture claim failed: ${claimed.error}`);

  const paidOut = await markPayoutSent(admin, created.id, "fixture-payout");
  if (!paidOut.ok) throw new Error(`fixture payout failed: ${paidOut.error}`);

  return created.id;
}

/**
 * Builds a SWAP through the real routes and walks it to released.
 *
 * This is the flow the site actually offers, so unlike makeDeal it goes through
 * createDeal, the invite, and both deposits rather than writing rows. Returned
 * at credentials_released, because what the callers below test is what happens
 * when the two confirmations arrive.
 */
async function makeSwap(
  seller: CurrentUser,
  buyer: CurrentUser,
  admin: CurrentUser,
): Promise<string> {
  const created = await createDeal({
    creator: seller,
    side: "seller",
    accountSummary: "GUARD FIXTURE — swap seller side, safe to delete.",
    counterAccountSummary: "GUARD FIXTURE — swap buyer side, safe to delete.",
    game: "eFootball",
    platform: null,
    level: null,
  });

  if (!created.ok) throw new Error(`swap fixture setup failed: ${created.error}`);

  fixtureIds.push(created.dealId);

  const joined = await joinDealByCode(buyer, created.inviteCode);
  if (!joined.ok) throw new Error(`swap fixture join failed: ${joined.error}`);

  // Both sides deposit: that symmetry is the whole difference from a cash deal.
  for (const party of [seller, buyer]) {
    const deposited = await depositCredentials(party, created.dealId, CREDS);
    if (!deposited.ok) throw new Error(`swap fixture deposit failed: ${deposited.error}`);
  }

  const released = await approveDelivery(admin, created.dealId);
  if (!released.ok) throw new Error(`swap fixture release failed: ${released.error}`);

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
    where: { dealId_side: { dealId: awaitingPayment, side: "seller" } },
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
    counterAccountSummary: "GUARD FIXTURE — self-join counter side, safe to delete.",
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

  const sellerReads = await revealDeliveredCredentials(sami, releasedDeal);
  assert.equal(sellerReads.ok, false);
  ok("the seller cannot read credentials through the buyer's route");

  assert.equal((await confirmClaimed(yassine, releasedDeal)).ok, false);
  ok("a non-buyer cannot confirm the claim");

  // The one case that must work: the real buyer reading a released account.
  const allowed = await revealDeliveredCredentials(karim, releasedDeal);
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
      referralCode: generateReferralCode(),
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

  // -------------------------------------------------------------------------
  // Konami transfer codes
  // -------------------------------------------------------------------------
  //
  // A live transfer code grants access to the account, so who may raise, answer
  // and read one matters as much as the credentials themselves.

  const codeDeal = await makeDeal(sami, karim, admin, "credentials_released");

  assert.equal((await requestTransferCode(yassine, codeDeal, "let me in")).ok, false);
  assert.equal(await listTransferCodes(codeDeal, yassine), null);
  ok("an outsider can neither request nor read a transfer code");

  // The seller asking themselves for a code would be meaningless, and would let
  // them fabricate the appearance of a completed exchange.
  const sellerAsks = await requestTransferCode(sami, codeDeal, "asking myself");
  assert.equal(sellerAsks.ok, false);
  assert.match((sellerAsks as { error: string }).error, /Only the buyer/i);
  ok("the seller cannot raise a code request");

  assert.equal((await requestTransferCode(karim, codeDeal, "Konami wants a code")).ok, true);
  ok("the buyer can ask for a code");

  const duplicate = await requestTransferCode(karim, codeDeal, "again");
  assert.equal(duplicate.ok, false);
  assert.match((duplicate as { error: string }).error, /already have a code request/i);
  ok("a second request cannot be stacked while one is unanswered");

  const openRequest = (await listTransferCodes(codeDeal, karim))![0];
  assert.equal(openRequest.code, null);
  ok("the code reads as null until the seller answers");

  assert.equal((await provideTransferCode(karim, openRequest.id, "111111")).ok, false);
  ok("the buyer cannot answer their own request");

  // Deliberate: if the admin could invent a code, the seller would no longer
  // need to stay reachable, which is the entire point of this step.
  const adminAnswers = await provideTransferCode(admin, openRequest.id, "222222");
  assert.equal(adminAnswers.ok, false);
  assert.match((adminAnswers as { error: string }).error, /Only the seller/i);
  ok("not even the admin can supply the code on the seller's behalf");

  assert.equal((await provideTransferCode(sami, openRequest.id, "")).ok, false);
  ok("an empty code is refused");

  assert.equal((await provideTransferCode(sami, openRequest.id, "483920")).ok, true);
  assert.equal((await provideTransferCode(sami, openRequest.id, "999999")).ok, false);
  ok("the seller answers once, and cannot overwrite it afterwards");

  const answered = (await listTransferCodes(codeDeal, karim))!;
  assert.equal(answered[0].code, "483920");
  assert.ok(answered[0].providedAt !== null);
  ok("the buyer reads back exactly the code the seller sent");

  // Stored encrypted, like the credentials.
  const storedCode = await prisma.transferCode.findFirstOrThrow({
    where: { dealId: codeDeal },
    select: { ciphertext: true },
  });
  assert.ok(storedCode.ciphertext?.startsWith("v1:"));
  assert.equal(storedCode.ciphertext?.includes("483920"), false);
  ok("the code is encrypted at rest, not stored in the clear");

  // The seller can hand a code over without being asked for one. Before this
  // existed, a seller holding a code sat looking at "nothing waiting on you"
  // with no way to send it — the exact stall the feature was built to remove.
  const unprompted = await sendTransferCode(sami, codeDeal, "550120");
  assert.equal(unprompted.ok, true);

  const allCodes = (await listTransferCodes(codeDeal, karim))!;
  const volunteered = allCodes.find((c) => c.code === "550120");
  assert.ok(volunteered, "the unprompted code should be readable by the buyer");
  assert.equal(volunteered!.unprompted, true);
  ok("the seller can send a code without the buyer asking first");

  assert.equal((await sendTransferCode(karim, codeDeal, "111111")).ok, false);
  assert.equal((await sendTransferCode(admin, codeDeal, "111111")).ok, false);
  ok("neither the buyer nor the admin can send a code as the seller");

  // An open request is answered rather than duplicated, so the buyer is never
  // left choosing between two entries.
  await requestTransferCode(karim, codeDeal, "stuck again");
  const before = (await listTransferCodes(codeDeal, karim))!.length;
  assert.equal((await sendTransferCode(sami, codeDeal, "660130")).ok, true);
  const after = (await listTransferCodes(codeDeal, karim))!;
  assert.equal(after.length, before);
  assert.equal(after.find((c) => c.requestNote === "stuck again")?.code, "660130");
  ok("sending while a request is open answers it instead of adding a second entry");

  // Settling does NOT end the exchange. Konami keeps sending codes after the
  // buyer confirms, and a completed deal cannot be disputed — so closing the
  // channel here left the buyer with no route at all.
  await confirmClaimed(karim, codeDeal);
  const settled = await prisma.deal.findUniqueOrThrow({
    where: { id: codeDeal },
    select: { status: true },
  });
  assert.equal(settled.status, "completed");

  assert.equal((await requestTransferCode(karim, codeDeal, "one more")).ok, true);
  ok("the buyer can still ask for a code after confirming");

  assert.equal((await sendTransferCode(sami, codeDeal, "770140")).ok, true);
  assert.equal(
    (await listTransferCodes(codeDeal, karim))!.some((c) => c.code === "770140"),
    true,
  );
  ok("the seller can still answer after the deal has settled");

  // -------------------------------------------------------------------------
  // Wallet: the balance is money, so every claim about it is asserted
  // -------------------------------------------------------------------------

  // A fresh promoter, so the arithmetic below is not competing with whatever
  // else the seed left lying around.
  const walletPromoter = await prisma.user.create({
    data: {
      email: `wallet-fixture-${Date.now()}@example.com`,
      displayName: "Wallet Fixture",
      passwordHash: await hashPassword("wallet-fixture-pw"),
      referralCode: generateReferralCode(),
    },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  fixtureUserIds.push(walletPromoter.id);

  const emptyBalance = await getBalance(walletPromoter.id);
  assert.equal(emptyBalance.earnedCents, 0);
  assert.equal(emptyBalance.availableCents, 0);
  assert.equal(emptyBalance.meetsMinimum, false);
  ok("a promoter with no referral credits has nothing to withdraw");

  assert.equal((await requestWithdrawal(walletPromoter, { amountCents: 5_000, method: "crypto", destinationName: "Wallet Fixture", destinationAccount: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", destinationNetwork: "TRC-20" })).ok, false);
  ok("a payout cannot be requested against an empty balance");

  // Credits written directly, rather than by completing twenty fixture deals.
  //
  // The balance is a SUM over amountCents and does not care how many rows
  // produced it, so one row exercises exactly the arithmetic thirty would —
  // and $40 is twenty completed deals, which is far too many fixtures to build
  // for an assertion about addition. That $2 is what a real completed deal
  // writes, and that it is written exactly once, is asserted separately below.
  const creditDeal = await makeDeal(walletPromoter, karim, admin, "credentials_released");
  await confirmClaimed(karim, creditDeal);

  const expectedEarned = 12_000;

  // Cleared first so the fixture is re-runnable against a database that
  // already has a row for this pair.
  await prisma.referralEarning.deleteMany({ where: { dealId: creditDeal } });

  await prisma.referralEarning.create({
    data: {
      promoterId: walletPromoter.id,
      traderId: karim.id,
      dealId: creditDeal,
      amountCents: expectedEarned,
    },
  });

  const earnedBalance = await getBalance(walletPromoter.id);
  assert.equal(earnedBalance.earnedCents, expectedEarned);
  assert.equal(earnedBalance.availableCents, expectedEarned);
  assert.equal(earnedBalance.meetsMinimum, true);
  ok("referral credits land in the balance, to the cent");

  assert.equal((await requestWithdrawal(walletPromoter, { amountCents: expectedEarned + 1, method: "crypto", destinationName: "Wallet Fixture", destinationAccount: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", destinationNetwork: "TRC-20" })).ok, false);
  ok("a promoter cannot withdraw more than they have");

  assert.equal((await requestWithdrawal(walletPromoter, { amountCents: MINIMUM_WITHDRAWAL_CENTS - 1, method: "crypto", destinationName: "Wallet Fixture", destinationAccount: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", destinationNetwork: "TRC-20" })).ok, false);
  ok("a payout below the $40 minimum is refused even when the balance covers it");

  const firstRequest = await requestWithdrawal(walletPromoter, {
    amountCents: MINIMUM_WITHDRAWAL_CENTS,
    method: "crypto",
    destinationName: "Wallet Fixture",
    destinationAccount: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    destinationNetwork: "TRC-20",
  });
  assert.equal(firstRequest.ok, true);

  const reserved = await getBalance(walletPromoter.id);
  assert.equal(reserved.availableCents, expectedEarned - MINIMUM_WITHDRAWAL_CENTS);
  ok("an open request reserves the money immediately");

  assert.equal((await requestWithdrawal(walletPromoter, { amountCents: MINIMUM_WITHDRAWAL_CENTS, method: "crypto", destinationName: "Wallet Fixture", destinationAccount: "x".repeat(34), destinationNetwork: "TRC-20" })).ok, false);
  ok("only one payout can be open at a time");

  const withdrawalId = (firstRequest as { withdrawalId: string }).withdrawalId;

  // The first payout does not go until a nominal test has been sent AND the
  // promoter has said it arrived. A crypto transfer to a mistyped address is
  // gone permanently, so this is the guard that stops the balance following
  // the test into the wrong place.
  assert.equal(await needsTestTransfer(withdrawalId), true);

  const sentTooEarly = await markWithdrawalSent(admin, withdrawalId, "0xtooearly");
  assert.equal(sentTooEarly.ok, false);
  assert.match((sentTooEarly as { error: string }).error, /test/i);
  ok("a first payout cannot be sent before the test transfer");

  assert.equal((await recordTestTransfer(walletPromoter, withdrawalId, "0xtest")).ok, false);
  ok("only an admin can record the test transfer");

  assert.equal((await recordTestTransfer(admin, withdrawalId, "   ")).ok, false);
  ok("recording the test needs a hash or reference");

  assert.equal((await recordTestTransfer(admin, withdrawalId, "0xtest")).ok, true);

  // Sent, but not yet confirmed by the person receiving it — which is the only
  // confirmation worth having. An admin ticking it off themselves proves
  // nothing about whether the money arrived.
  assert.equal((await markWithdrawalSent(admin, withdrawalId, "0xstill-too-early")).ok, false);
  ok("the balance still waits after the test is sent, until they confirm it");

  assert.equal((await confirmTestTransfer(karim, withdrawalId)).ok, false);
  ok("somebody else cannot confirm a test on your payout");

  assert.equal((await confirmTestTransfer(walletPromoter, withdrawalId)).ok, true);
  assert.equal(await needsTestTransfer(withdrawalId), false);
  ok("the promoter confirms the test, and the balance is released to be sent");

  assert.equal((await markWithdrawalSent(karim, withdrawalId, "0xnope")).ok, false);
  assert.equal((await rejectWithdrawal(walletPromoter, withdrawalId, "mine now")).ok, false);
  ok("only an admin can send or refuse a payout");

  assert.equal((await markWithdrawalSent(admin, withdrawalId, "   ")).ok, false);
  ok("marking a payout sent requires a reference");

  // Refusing hands the money straight back, with no compensating write.
  assert.equal((await rejectWithdrawal(admin, withdrawalId, "address missing the network")).ok, true);
  const afterReject = await getBalance(walletPromoter.id);
  assert.equal(afterReject.availableCents, expectedEarned);
  ok("a refused payout returns the money to the balance");

  const second = await requestWithdrawal(walletPromoter, {
    amountCents: MINIMUM_WITHDRAWAL_CENTS,
    method: "crypto",
    destinationName: "Wallet Fixture",
    destinationAccount: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    destinationNetwork: "TRC-20",
  });
  const secondId = (second as { withdrawalId: string }).withdrawalId;

  // Still their first *sent* payout — the earlier one was refused — so the test
  // applies again. Correct: the destination is typed fresh on every request, so
  // confirming a test against the previous address proves nothing about this
  // one. The requirement lifts on having been paid, not on having confirmed.
  assert.equal(await needsTestTransfer(secondId), true);
  ok("a refused first payout does not spend the test requirement");

  assert.equal((await recordTestTransfer(admin, secondId, "0xtest2")).ok, true);
  assert.equal((await confirmTestTransfer(walletPromoter, secondId)).ok, true);

  assert.equal((await markWithdrawalSent(admin, secondId, "0xsent")).ok, true);
  assert.equal((await markWithdrawalSent(admin, secondId, "0xsent-again")).ok, false);
  ok("a payout cannot be marked sent twice");

  const afterSent = await getBalance(walletPromoter.id);
  assert.equal(afterSent.availableCents, expectedEarned - MINIMUM_WITHDRAWAL_CENTS);
  ok("a sent payout stays deducted");

  // The threshold does not move once somebody has been paid. One number, every
  // time — a payout is a manual transfer whichever one it is.
  assert.equal(afterSent.meetsMinimum, afterSent.availableCents >= MINIMUM_WITHDRAWAL_CENTS);
  assert.equal(
    (await requestWithdrawal(walletPromoter, { amountCents: MINIMUM_WITHDRAWAL_CENTS - 1, method: "crypto", destinationName: "Wallet Fixture", destinationAccount: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE", destinationNetwork: "TRC-20" })).ok,
    false,
  );
  ok("the $40 minimum still applies after a payout has been sent");

  // -------------------------------------------------------------------------
  // Referral crediting: this is the only money the service owes anyone
  // -------------------------------------------------------------------------

  const promoterA = await prisma.user.create({
    data: {
      email: `promoter-a-${Date.now()}@example.com`,
      displayName: "Promoter A",
      passwordHash: await hashPassword("promoter-a-pw"),
      referralCode: generateReferralCode(),
    },
    select: { id: true },
  });
  fixtureUserIds.push(promoterA.id);

  const promoterB = await prisma.user.create({
    data: {
      email: `promoter-b-${Date.now()}@example.com`,
      displayName: "Promoter B",
      passwordHash: await hashPassword("promoter-b-pw"),
      referralCode: generateReferralCode(),
    },
    select: { id: true },
  });
  fixtureUserIds.push(promoterB.id);

  // Two traders, each introduced by a different promoter — the ordinary case,
  // where one completed deal owes two people $2.
  const traderA = await prisma.user.create({
    data: {
      email: `trader-a-${Date.now()}@example.com`,
      displayName: "Trader A",
      passwordHash: await hashPassword("trader-a-pw"),
      referralCode: generateReferralCode(),
      referredById: promoterA.id,
    },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  fixtureUserIds.push(traderA.id);

  const traderB = await prisma.user.create({
    data: {
      email: `trader-b-${Date.now()}@example.com`,
      displayName: "Trader B",
      passwordHash: await hashPassword("trader-b-pw"),
      referralCode: generateReferralCode(),
      referredById: promoterB.id,
    },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  fixtureUserIds.push(traderB.id);

  const referralDeal = await makeSwap(traderA, traderB, admin);

  const beforeComplete = await getBalance(promoterA.id);
  assert.equal(beforeComplete.earnedCents, 0);
  ok("an unfinished deal owes its promoters nothing");

  await confirmClaimed(traderB, referralDeal);
  await confirmClaimed(traderA, referralDeal);

  assert.equal((await getBalance(promoterA.id)).earnedCents, REFERRAL_REWARD_CENTS);
  assert.equal((await getBalance(promoterB.id)).earnedCents, REFERRAL_REWARD_CENTS);
  ok("a completed swap credits $2 to each side's promoter");

  // The guard that stands between a retried completion and paying twice.
  await creditReferralsForDeal(referralDeal);
  await creditReferralsForDeal(referralDeal);
  assert.equal((await getBalance(promoterA.id)).earnedCents, REFERRAL_REWARD_CENTS);
  ok("crediting the same deal again pays nothing extra");

  // Unwinding a completed deal takes the credits with it, or the service pays
  // for a trade that did not happen.
  assert.equal((await forceRefundCompleted(admin, referralDeal)).ok, true);
  assert.equal((await getBalance(promoterA.id)).earnedCents, 0);
  assert.equal((await getBalance(promoterB.id)).earnedCents, 0);
  ok("force-refunding a completed deal removes the referral credits");

  // A promoter must not earn from a deal they were personally in — otherwise
  // introducing one friend and swapping with them repeatedly is free money.
  const selfDealer = await prisma.user.create({
    data: {
      email: `self-dealer-${Date.now()}@example.com`,
      displayName: "Self Dealer",
      passwordHash: await hashPassword("self-dealer-pw"),
      referralCode: generateReferralCode(),
    },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  fixtureUserIds.push(selfDealer.id);

  const theirRecruit = await prisma.user.create({
    data: {
      email: `recruit-${Date.now()}@example.com`,
      displayName: "Their Recruit",
      passwordHash: await hashPassword("recruit-pw"),
      referralCode: generateReferralCode(),
      referredById: selfDealer.id,
    },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  fixtureUserIds.push(theirRecruit.id);

  const selfDeal = await makeSwap(theirRecruit, selfDealer, admin);
  await confirmClaimed(selfDealer, selfDeal);
  await confirmClaimed(theirRecruit, selfDeal);

  assert.equal((await getBalance(selfDealer.id)).earnedCents, 0);
  ok("a promoter earns nothing from a deal they traded in themselves");

  // -------------------------------------------------------------------------
  // Promoters: let in to advertise, not to trade
  // -------------------------------------------------------------------------
  //
  // A promoter account is created by approving an application at /promote,
  // without anybody's code. Hiding the deal buttons from them is not a control
  // — a server action is a public endpoint — so the refusal has to live in the
  // domain layer, and that is what these two assert.
  const promoterAccount = await prisma.user.create({
    data: {
      email: `promoter-role-${Date.now()}@example.com`,
      displayName: "Promoter Role Fixture",
      passwordHash: await hashPassword("promoter-role-pw"),
      role: "promoter",
      referralCode: generateReferralCode(),
    },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  fixtureUserIds.push(promoterAccount.id);

  const promoterCreate = await createDeal({
    creator: promoterAccount,
    side: "seller",
    accountSummary: "GUARD FIXTURE — a promoter should not get this far.",
    counterAccountSummary: "GUARD FIXTURE — a promoter should not get this far either.",
    game: "eFootball",
    platform: null,
    level: null,
  });

  assert.equal(promoterCreate.ok, false);
  assert.match((promoterCreate as { error: string }).error, /cannot open or join/i);
  ok("a promoter account cannot open a swap");

  // A real, live invite — so this proves the role is refused rather than the
  // code merely being invalid.
  const openInvite = await createDeal({
    creator: sami,
    side: "seller",
    accountSummary: "GUARD FIXTURE — invite a promoter must not be able to take.",
    counterAccountSummary: "GUARD FIXTURE — the other side of it.",
    game: "eFootball",
    platform: null,
    level: null,
  });

  if (!openInvite.ok) throw new Error("promoter-join fixture failed");
  fixtureIds.push(openInvite.dealId);

  const promoterJoin = await joinDealByCode(promoterAccount, openInvite.inviteCode);
  assert.equal(promoterJoin.ok, false);
  assert.match((promoterJoin as { error: string }).error, /cannot open or join/i);
  ok("a promoter account cannot join a swap, even holding a valid invite");

  // ...and the invite is still good for a real trader afterwards, so a refused
  // promoter has not burned it.
  assert.equal((await joinDealByCode(karim, openInvite.inviteCode)).ok, true);
  ok("a promoter's refused join leaves the invite usable");

  // An archived cash deal must never generate a credit. Those closed before the
  // programme existed, and without this the reconcile pass would invent a debt
  // for every one of them the first time it ran.
  const archivedCash = await makeDeal(traderA, traderB, admin, "credentials_released");
  await confirmClaimed(traderB, archivedCash);

  assert.equal(await prisma.referralEarning.count({ where: { dealId: archivedCash } }), 0);
  assert.equal((await creditReferralsForDeal(archivedCash)).credited, 0);
  assert.equal((await reconcileReferralCredits()).credited, 0);
  ok("a completed cash deal from the retired flow credits nobody, even on reconcile");

  // Racing requests must not both pass the balance check and over-commit it.
  const racePromoter = await prisma.user.create({
    data: {
      email: `wallet-race-${Date.now()}@example.com`,
      displayName: "Race Fixture",
      passwordHash: await hashPassword("race-fixture-pw"),
      referralCode: generateReferralCode(),
    },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });
  fixtureUserIds.push(racePromoter.id);

  const raceDeal = await makeDeal(racePromoter, karim, admin, "credentials_released");
  await confirmClaimed(karim, raceDeal);
  // As above, so the fixture is re-runnable.
  await prisma.referralEarning.deleteMany({ where: { dealId: raceDeal } });
  await prisma.referralEarning.create({
    data: {
      promoterId: racePromoter.id,
      traderId: karim.id,
      dealId: raceDeal,
      amountCents: 8_000,
    },
  });
  const raceBalance = await getBalance(racePromoter.id);

  const attempts = await Promise.allSettled(
    Array.from({ length: 4 }, () =>
      requestWithdrawal(racePromoter, {
        amountCents: raceBalance.availableCents,
        method: "crypto",
        destinationName: "Race Fixture",
        destinationAccount: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
        destinationNetwork: "TRC-20",
      }),
    ),
  );
  const granted = attempts.filter((a) => a.status === "fulfilled" && a.value.ok).length;
  assert.ok(granted <= 1, `granted ${granted} concurrent payouts of the whole balance`);

  const raced = await getBalance(racePromoter.id);
  assert.ok(raced.netCents >= 0, `balance went negative: ${raced.netCents}`);
  ok("concurrent requests cannot commit the same balance twice");

  // Each method stores only the fields it uses. A bank payout carrying a
  // network, or a crypto one carrying a BIC, means the wrong field was read
  // somewhere — and the admin sends money from these.
  await prisma.withdrawal.deleteMany({ where: { promoterId: walletPromoter.id, status: "requested" } });

  const bank = await requestWithdrawal(walletPromoter, {
    amountCents: MINIMUM_WITHDRAWAL_CENTS,
    method: "bank_transfer",
    destinationName: "Wallet Fixture",
    destinationAccount: "AE070331234567890123456",
    destinationBank: "Emirates NBD",
    destinationBic: "EBILAEAD",
  });
  assert.equal(bank.ok, true);

  const bankRow = await prisma.withdrawal.findUniqueOrThrow({
    where: { id: (bank as { withdrawalId: string }).withdrawalId },
    select: {
      destinationBank: true,
      destinationBic: true,
      destinationNetwork: true,
      destinationProvider: true,
    },
  });
  assert.equal(bankRow.destinationBank, "Emirates NBD");
  assert.equal(bankRow.destinationBic, "EBILAEAD");
  assert.equal(bankRow.destinationNetwork, null);
  assert.equal(bankRow.destinationProvider, null);
  ok("a bank payout stores its bank details and nothing belonging to another method");

  const fields = destinationFields({
    method: "bank_transfer",
    destinationName: "Wallet Fixture",
    destinationAccount: "AE070331234567890123456",
    destinationNetwork: null,
    destinationBank: "Emirates NBD",
    destinationBic: "EBILAEAD",
    destinationProvider: null,
  });
  assert.deepEqual(
    fields.map((f) => f.label),
    ["Name on the account", "IBAN / account number", "Bank", "SWIFT / BIC"],
  );
  ok("a destination renders as separate labelled fields, not one blob");

  // -------------------------------------------------------------------------
  // Phase 9: account-for-account swaps
  //
  // A swap has no money in it, so the protection cannot be "we hold the cash".
  // It is "neither account moves until both are in, and both are released at
  // the same moment". These check that the asymmetry of a cash deal — one
  // depositor, one payer, one confirmer — becomes symmetric here.
  // -------------------------------------------------------------------------

  // Captured before any swap exists, so the comparison at the end measures a
  // real difference rather than comparing a number to itself.
  const sellerBalanceBeforeSwap = (await getBalance(sami.id)).availableCents;
  const buyerBalanceBeforeSwap = (await getBalance(karim.id)).availableCents;

  const noCounter = await createDeal({
    creator: sami,
    side: "seller",
    accountSummary: "GUARD FIXTURE — swap without a counter-offer, safe to delete.",
    game: "eFootball",
    platform: null,
    level: null,
    counterAccountSummary: "   ",
  });
  assert.equal(noCounter.ok, false);
  ok("a swap with no account offered in exchange is refused");

  const swapCreated = await createDeal({
    creator: sami,
    side: "seller",
    accountSummary: "GUARD FIXTURE — swap seller side, safe to delete.",
    game: "eFootball",
    platform: null,
    level: null,
    counterAccountSummary: "GUARD FIXTURE — swap buyer side, safe to delete.",
  });

  if (!swapCreated.ok) throw new Error(`swap setup failed: ${swapCreated.error}`);
  fixtureIds.push(swapCreated.dealId);
  const swap = swapCreated.dealId;

  const swapRow = await prisma.deal.findUniqueOrThrow({
    where: { id: swap },
    select: { agreedPriceCents: true, feeCents: true, sellerPayoutCents: true, tradeKind: true },
  });
  assert.equal(swapRow.tradeKind, "swap");
  assert.equal(swapRow.agreedPriceCents, 0);
  assert.equal(swapRow.feeCents, 0);
  assert.equal(swapRow.sellerPayoutCents, 0);
  ok("a swap carries no price, no fee and no payout — there is no way to give it one");

  const swapJoin = await joinDealByCode(karim, swapCreated.inviteCode);
  assert.equal(swapJoin.ok, true);

  const swapSellerDeposit = await depositCredentials(sami, swap, CREDS);
  assert.equal(swapSellerDeposit.ok, true);
  ok("the seller can deposit on a swap");

  // The whole point: releasing one account before the other is in would hand
  // the first party everything for nothing.
  const swapEarlyRelease = await approveDelivery(admin, swap);
  assert.equal(swapEarlyRelease.ok, false);
  ok("neither account is released while only one side has deposited");

  const stillWaiting = await prisma.deal.findUniqueOrThrow({
    where: { id: swap },
    select: { status: true },
  });
  assert.equal(stillWaiting.status, "awaiting_credentials");
  ok("a half-deposited swap stays waiting rather than advancing");

  assert.equal((await depositCredentials(yassine, swap, ATTACK_CREDS)).ok, false);
  ok("an unrelated user still cannot deposit on a swap");

  const swapBuyerDeposit = await depositCredentials(karim, swap, {
    ...CREDS,
    loginEmail: "guard-swap-buyer@example.com",
  });
  assert.equal(swapBuyerDeposit.ok, true);
  ok("the buyer can deposit their own account on a swap");

  const bothIn = await prisma.deal.findUniqueOrThrow({
    where: { id: swap },
    select: { status: true },
  });
  assert.equal(bothIn.status, "admin_verifying");
  ok("a swap goes to verification once both accounts are in — never to payment");

  // No money means no payment step at all; the status machine must not offer
  // one, or a buyer could be talked into paying for a swap they already paid
  // for with an account.
  const swapPay = await submitPayment(karim, swap, {
    method: "crypto",
    txHash: "0xshould-not-apply",
    reference: null,
    instructionsSnapshot: "fixture",
  });
  assert.equal(swapPay.ok, false);
  ok("a swap cannot take a payment");

  assert.equal((await approveDelivery(admin, swap)).ok, true);
  ok("both accounts release together once verified");

  const buyerReads = await revealDeliveredCredentials(karim, swap);
  assert.equal(buyerReads.ok, true);
  assert.equal(
    (buyerReads as { credentials: { loginEmail: string } }).credentials.loginEmail,
    CREDS.loginEmail,
  );
  ok("the buyer receives the seller's account on a swap");

  const swapSellerReads = await revealDeliveredCredentials(sami, swap);
  assert.equal(swapSellerReads.ok, true);
  assert.equal(
    (swapSellerReads as { credentials: { loginEmail: string } }).credentials.loginEmail,
    "guard-swap-buyer@example.com",
  );
  ok("the seller receives the buyer's account on a swap — each gets the other's");

  assert.equal((await revealDeliveredCredentials(yassine, swap)).ok, false);
  ok("a non-party reads neither side of a swap");

  const firstConfirm = await confirmClaimed(karim, swap);
  assert.equal(firstConfirm.ok, true);

  const halfConfirmed = await prisma.deal.findUniqueOrThrow({
    where: { id: swap },
    select: { status: true, buyerConfirmedAt: true, sellerConfirmedAt: true },
  });
  assert.notEqual(halfConfirmed.buyerConfirmedAt, null);
  assert.equal(halfConfirmed.sellerConfirmedAt, null);
  assert.notEqual(halfConfirmed.status, "completed");
  ok("one party confirming does not complete a swap");

  const secondConfirm = await confirmClaimed(sami, swap);
  assert.equal(secondConfirm.ok, true);

  const done = await prisma.deal.findUniqueOrThrow({
    where: { id: swap },
    select: { status: true, sellerConfirmedAt: true, completedAt: true },
  });
  assert.equal(done.status, "completed");
  assert.notEqual(done.sellerConfirmedAt, null);
  assert.notEqual(done.completedAt, null);
  ok("a swap completes only when both parties have confirmed");

  // A completed swap must not leave anything sitting in a balance: there was
  // never any money, and a payout figure above zero would be one the admin
  // could actually send.
  assert.equal((await getBalance(sami.id)).availableCents, sellerBalanceBeforeSwap);
  assert.equal((await getBalance(karim.id)).availableCents, buyerBalanceBeforeSwap);
  ok("a completed swap leaves both balances exactly where they were");

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
