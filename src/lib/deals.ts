// Deal lifecycle. SERVER ONLY.
//
// Every state change lives here rather than in the pages, so the rules that
// protect people's money and accounts are in one auditable place.
//
// Two habits throughout:
//
//   1. State changes use a conditional `updateMany` whose WHERE clause repeats
//      the state the change assumes (status, which side is empty, who owns it).
//      If two requests race, the second matches zero rows and is rejected
//      instead of overwriting the first. Reading, checking, then writing would
//      let both through.
//   2. Functions return a result object instead of throwing, so the UI can show
//      a specific message. Only genuine faults throw.
import { prisma } from "@/lib/prisma";
import { decryptCredentials, encryptCredentials, type CredentialData } from "@/lib/crypto";
import { generateDealReference, generateInviteCode } from "@/lib/ids";
import { creditReferralsForDeal } from "@/lib/referrals";
import { PRE_PAYMENT_STATUSES } from "@/lib/deal-status";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/escrow-flow";
import type { CurrentUser } from "@/lib/dal";
import type { DealSide, DealStatus, PaymentMethod, TradeKind } from "@/generated/prisma/client";

/**
 * How long the buyer gets to claim the account and confirm, once credentials
 * are released. The spec allows 24-48h; 48 is the kinder end for someone in a
 * different timezone.
 *
 * Defined in lib/escrow-flow — client components quote it in copy and cannot
 * import this module — and re-exported here so server callers need not care.
 */
export { CONFIRMATION_WINDOW_HOURS };

export type DealFailure = { ok: false; error: string };
/** Success with no payload; `DealResult<{ x: string }>` adds one. */
export type DealResult<T = unknown> = ({ ok: true } & T) | DealFailure;

/** Prisma's unique-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

/** The side the creator did NOT take — the side the invite is for. */
export function oppositeSide(side: DealSide): DealSide {
  return side === "seller" ? "buyer" : "seller";
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export type CreateDealInput = {
  creator: CurrentUser;
  side: DealSide;
  accountSummary: string;
  game: string;
  platform: string | null;
  level: number | null;
  /** The account the other side puts up. Required: every deal is a swap. */
  counterAccountSummary: string;
};

/**
 * The one thing a promoter account cannot do.
 *
 * Promoters are let in through /promote without anybody's code, on the strength
 * of an audience rather than a trade. They share a code and collect earnings;
 * they do not trade. Enforced here rather than by hiding buttons, because a
 * server action is a public endpoint and hiding a form is not a control.
 */
const PROMOTERS_CANNOT_TRADE =
  "A promoter account cannot open or join a swap. Ask someone for their code and register a normal account if you want to trade.";

export async function createDeal(
  input: CreateDealInput,
): Promise<DealResult<{ dealId: string; reference: string; inviteCode: string }>> {
  if (input.creator.role === "promoter") {
    return { ok: false, error: PROMOTERS_CANNOT_TRADE };
  }

  const counter = input.counterAccountSummary.trim();

  if (!counter) {
    return { ok: false, error: "Describe the account being offered in exchange." };
  }

  const isSeller = input.side === "seller";

  // References are short and human-readable, so collisions are possible. Retry
  // rather than failing the user's submission.
  for (let attempt = 0; attempt < 6; attempt++) {
    const reference = generateDealReference();
    const inviteCode = generateInviteCode();

    try {
      const deal = await prisma.deal.create({
        data: {
          reference,
          inviteCode,
          createdById: input.creator.id,
          createdSide: input.side,
          sellerId: isSeller ? input.creator.id : null,
          buyerId: isSeller ? null : input.creator.id,
          accountSummary: input.accountSummary,
          tradeKind: "swap",
          counterAccountSummary: counter,
          game: input.game,
          platform: input.platform,
          level: input.level,
          currency: "USD",
          // agreedPriceCents, feeBps, feeCents and sellerPayoutCents all
          // default to 0 in the schema. A swap has no price, and the service
          // takes no commission from one — the money it makes is nothing, and
          // the money it owes is $2 a side to the promoters. See lib/referrals.
          status: "awaiting_counterparty",
        },
        select: { id: true, reference: true, inviteCode: true },
      });

      return {
        ok: true,
        dealId: deal.id,
        reference: deal.reference,
        inviteCode: deal.inviteCode!,
      };
    } catch (error) {
      if (isUniqueViolation(error)) continue; // reference clashed — try again
      throw error;
    }
  }

  return { ok: false, error: "Could not allocate a deal reference. Please try again." };
}

// ---------------------------------------------------------------------------
// Join
// ---------------------------------------------------------------------------

/** What the invitee sees before committing. Deliberately no credentials. */
export type DealInvitePreview = {
  dealId: string;
  reference: string;
  accountSummary: string;
  game: string;
  platform: string | null;
  level: number | null;
  agreedPriceCents: number;
  sellerPayoutCents: number;
  feeCents: number;
  currency: string;
  /** The side the joiner would take. */
  joinAs: DealSide;
  counterpartyName: string;
  createdById: string;
};

/**
 * Looks up an open invite. Returns null for "no such code" and for a code that
 * has already been used — the invitee does not need to be told which.
 */
export async function findInvite(code: string): Promise<DealInvitePreview | null> {
  const trimmed = code.trim();

  if (!trimmed) return null;

  const deal = await prisma.deal.findUnique({
    where: { inviteCode: trimmed },
    select: {
      id: true,
      reference: true,
      accountSummary: true,
      game: true,
      platform: true,
      level: true,
      agreedPriceCents: true,
      sellerPayoutCents: true,
      feeCents: true,
      currency: true,
      createdSide: true,
      createdById: true,
      status: true,
      createdBy: { select: { displayName: true } },
    },
  });

  if (!deal || deal.status !== "awaiting_counterparty") return null;

  return {
    dealId: deal.id,
    reference: deal.reference,
    accountSummary: deal.accountSummary,
    game: deal.game,
    platform: deal.platform,
    level: deal.level,
    agreedPriceCents: deal.agreedPriceCents,
    sellerPayoutCents: deal.sellerPayoutCents,
    feeCents: deal.feeCents,
    currency: deal.currency,
    joinAs: oppositeSide(deal.createdSide),
    counterpartyName: deal.createdBy.displayName,
    createdById: deal.createdById,
  };
}

export async function joinDealByCode(
  user: CurrentUser,
  code: string,
): Promise<DealResult<{ dealId: string; reference: string; joinedAs: DealSide }>> {
  // Checked before the code is looked up, so a promoter holding a leaked invite
  // learns nothing about whether it was valid.
  if (user.role === "promoter") {
    return { ok: false, error: PROMOTERS_CANNOT_TRADE };
  }

  const invite = await findInvite(code);

  if (!invite) {
    return {
      ok: false,
      error: "That invite code is not valid. It may have been used already, or the deal was cancelled.",
    };
  }

  // A person cannot be both sides. Beyond being nonsense, self-dealing is how
  // someone would try to launder a payout through the escrow.
  if (invite.createdById === user.id) {
    return { ok: false, error: "This is your own deal. Send the code to the other person." };
  }

  const joiningAsSeller = invite.joinAs === "seller";

  // Conditional update: only succeeds while the deal is still open and the side
  // is still empty, so two people racing the same code cannot both join.
  const result = await prisma.deal.updateMany({
    where: {
      id: invite.dealId,
      status: "awaiting_counterparty",
      ...(joiningAsSeller ? { sellerId: null } : { buyerId: null }),
    },
    data: {
      ...(joiningAsSeller ? { sellerId: user.id } : { buyerId: user.id }),
      // Single-use: clearing the code stops a forwarded link from working.
      inviteCode: null,
      inviteAcceptedAt: new Date(),
      // The seller now owes the account details.
      status: "awaiting_credentials",
    },
  });

  if (result.count !== 1) {
    return { ok: false, error: "Someone already joined this deal." };
  }

  return { ok: true, dealId: invite.dealId, reference: invite.reference, joinedAs: invite.joinAs };
}

// ---------------------------------------------------------------------------
// Deposit credentials
// ---------------------------------------------------------------------------

/**
 * The seller hands the account over to escrow. Encrypted before it reaches the
 * database; the buyer cannot read it until the admin approves delivery.
 *
 * Allowed while awaiting_credentials (first submission) and awaiting_payment
 * (correcting a typo before the buyer has paid). Once payment is submitted the
 * account is frozen — swapping the credentials after someone has paid is
 * exactly the scam this service exists to prevent.
 */
export async function depositCredentials(
  user: CurrentUser,
  dealId: string,
  data: CredentialData,
): Promise<DealResult> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      sellerId: true,
      buyerId: true,
      status: true,
      tradeKind: true,
      credentials: { select: { side: true } },
    },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  // On a cash deal only the seller ever deposits. On a swap both do, each into
  // their own row — which is what the (dealId, side) unique key is for.
  const side: DealSide | null =
    deal.sellerId === user.id ? "seller" : deal.buyerId === user.id ? "buyer" : null;

  if (side === null) {
    return { ok: false, error: "Only a party to this deal can submit account details." };
  }

  if (deal.tradeKind === "cash" && side !== "seller") {
    return { ok: false, error: "Only the seller can submit the account details." };
  }

  const editable: DealStatus[] = ["awaiting_credentials", "awaiting_payment"];

  if (!editable.includes(deal.status)) {
    return {
      ok: false,
      error: "The account details can no longer be changed at this stage of the deal.",
    };
  }

  const ciphertext = encryptCredentials(data);

  // Where the deal goes next depends on who still owes an account.
  //
  //   cash — the seller has deposited, so the buyer now pays.
  //   swap — nobody pays. The deal waits in awaiting_credentials until BOTH
  //          sides have deposited, then goes straight to the admin. Computed
  //          from the rows that will exist after this write, so a second
  //          deposit by the same side cannot advance it.
  const sidesAfter = new Set(deal.credentials.map((row) => row.side));
  sidesAfter.add(side);

  const bothDeposited = sidesAfter.has("seller") && sidesAfter.has("buyer");
  const nextStatus: DealStatus =
    deal.tradeKind === "swap"
      ? bothDeposited
        ? "admin_verifying"
        : "awaiting_credentials"
      : "awaiting_payment";

  // Both writes together: the deal must never claim credentials exist without
  // the row, or advance without them.
  await prisma.$transaction([
    prisma.credential.upsert({
      where: { dealId_side: { dealId: deal.id, side } },
      update: { ciphertext },
      create: { dealId: deal.id, side, ciphertext },
    }),
    prisma.deal.updateMany({
      where: { id: deal.id, status: { in: editable } },
      data: { status: nextStatus },
    }),
  ]);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Payment  (manual settlement — no gateway, the admin confirms by hand)
// ---------------------------------------------------------------------------

/**
 * The buyer says they have sent the money. This does NOT mean funds are held —
 * only the admin confirming receipt does that. The deal parks in
 * payment_submitted until then.
 */
export async function submitPayment(
  user: CurrentUser,
  dealId: string,
  input: {
    method: PaymentMethod;
    txHash: string | null;
    reference: string | null;
    instructionsSnapshot: string;
  },
): Promise<DealResult> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      buyerId: true,
      status: true,
      credentials: { where: { side: "seller" }, select: { id: true } },
    },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  if (deal.buyerId !== user.id) {
    return { ok: false, error: "Only the buyer can submit payment for this deal." };
  }

  // Paying before the account is in escrow would defeat the point.
  if (deal.credentials.length === 0) {
    return { ok: false, error: "The seller has not deposited the account yet. Do not pay." };
  }

  const result = await prisma.deal.updateMany({
    where: { id: dealId, buyerId: user.id, status: "awaiting_payment" },
    data: {
      status: "payment_submitted",
      paymentMethod: input.method,
      paymentTxHash: input.txHash,
      paymentReference: input.reference,
      // Frozen copy of what was on screen, so a later edit to the wallet
      // address cannot muddy a dispute.
      paymentInstructionsSnapshot: input.instructionsSnapshot,
      paymentSubmittedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    return { ok: false, error: "This deal is not waiting for payment." };
  }

  return { ok: true };
}

/**
 * ADMIN. The money actually arrived. From here the funds are held in escrow and
 * the admin owes both sides a verification of the account.
 */
export async function confirmPaymentReceived(
  admin: CurrentUser,
  dealId: string,
): Promise<DealResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const result = await prisma.deal.updateMany({
    where: { id: dealId, status: "payment_submitted" },
    data: {
      status: "admin_verifying",
      paymentConfirmedAt: new Date(),
      paymentConfirmedById: admin.id,
      verificationStartedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    return { ok: false, error: "This deal is not waiting for a payment confirmation." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Verification and delivery
// ---------------------------------------------------------------------------

/**
 * ADMIN ONLY. Decrypts the account so the admin can log in and check it matches
 * what was promised.
 *
 * This is the one place credentials are read before delivery. The result is
 * never logged and never persisted — it goes straight to the admin's screen.
 */
export async function revealCredentialsToAdmin(
  admin: CurrentUser,
  dealId: string,
  side: DealSide = "seller",
): Promise<DealResult<{ credentials: CredentialData }>> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  // Defaults to the seller's account, which is the only one a cash deal has.
  // A swap has two, and the admin has to check both before releasing either.
  const credential = await prisma.credential.findUnique({
    where: { dealId_side: { dealId, side } },
    select: { ciphertext: true },
  });

  if (!credential) return { ok: false, error: "No account details have been deposited yet." };

  return { ok: true, credentials: decryptCredentials(credential.ciphertext) };
}

/** ADMIN. Records the outcome of checking the account, without releasing it. */
export async function recordVerification(
  admin: CurrentUser,
  dealId: string,
  note: string,
  side: DealSide = "seller",
): Promise<DealResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const credential = await prisma.credential.findUnique({
    where: { dealId_side: { dealId, side } },
    select: { id: true },
  });

  if (!credential) return { ok: false, error: "No account details to verify." };

  await prisma.credential.update({
    where: { dealId_side: { dealId, side } },
    data: { lastVerifiedAt: new Date(), lastVerifiedById: admin.id, verificationNote: note },
  });

  return { ok: true };
}

/**
 * ADMIN. The decisive step: hand the account to the buyer.
 *
 * Snapshots the exact ciphertext delivered onto the deal, so that if the seller
 * later changes the credential row, a dispute can still prove what the buyer
 * actually received. Also starts the confirmation clock.
 */
export async function approveDelivery(admin: CurrentUser, dealId: string): Promise<DealResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      status: true,
      tradeKind: true,
      credentials: { select: { side: true, ciphertext: true } },
    },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  const sellerCredential = deal.credentials.find((row) => row.side === "seller");
  const buyerCredential = deal.credentials.find((row) => row.side === "buyer");

  if (!sellerCredential) {
    return { ok: false, error: "There are no account details to release." };
  }

  // A swap hands over two accounts at once. Releasing one without the other
  // would hand the first party everything and leave the second with nothing —
  // the simultaneity IS the escrow here, since there is no money to hold.
  if (deal.tradeKind === "swap" && !buyerCredential) {
    return { ok: false, error: "Both accounts must be deposited before release." };
  }

  const deadline = new Date(Date.now() + CONFIRMATION_WINDOW_HOURS * 60 * 60 * 1000);

  const result = await prisma.deal.updateMany({
    where: { id: dealId, status: "admin_verifying" },
    data: {
      status: "credentials_released",
      deliveryApprovedAt: new Date(),
      deliveryApprovedById: admin.id,
      deliveredCiphertext: sellerCredential.ciphertext,
      deliveredCounterCiphertext:
        deal.tradeKind === "swap" ? (buyerCredential?.ciphertext ?? null) : null,
      credentialsReleasedAt: new Date(),
      confirmationDeadline: deadline,
    },
  });

  if (result.count !== 1) {
    return { ok: false, error: "This deal is not ready for delivery approval." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Buyer claim
// ---------------------------------------------------------------------------

/**
 * A party reads the account they are receiving. Moves the deal to `claiming` on
 * first view, which is the audit point for "they have had them".
 *
 * On a cash deal only the buyer receives anything. On a swap both do, and each
 * gets the *other* party's account — so the side asking determines which
 * snapshot comes back.
 *
 * Reads the delivered snapshot, not the live credential row: everyone must see
 * exactly what the admin approved.
 */
export async function revealDeliveredCredentials(
  user: CurrentUser,
  dealId: string,
): Promise<DealResult<{ credentials: CredentialData }>> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      status: true,
      tradeKind: true,
      deliveredCiphertext: true,
      deliveredCounterCiphertext: true,
    },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  const isBuyer = deal.buyerId === user.id;
  const isSeller = deal.sellerId === user.id;

  // On a cash deal the seller keeps no claim on anything: they handed the
  // account over and get money instead.
  if (!isBuyer && !(isSeller && deal.tradeKind === "swap")) {
    return { ok: false, error: "Only the buyer can view these." };
  }

  const readable: DealStatus[] = ["credentials_released", "claiming", "completed", "disputed"];

  // The buyer receives the seller's account; on a swap the seller receives the
  // buyer's.
  const ciphertext = isBuyer ? deal.deliveredCiphertext : deal.deliveredCounterCiphertext;

  if (!readable.includes(deal.status) || !ciphertext) {
    return { ok: false, error: "The account details have not been released yet." };
  }

  // First view starts the claiming stage — by either party, since on a swap
  // whoever looks first has begun taking delivery.
  if (deal.status === "credentials_released") {
    await prisma.deal.updateMany({
      where: { id: dealId, status: "credentials_released" },
      data: { status: "claiming" },
    });
  }

  return { ok: true, credentials: decryptCredentials(ciphertext) };
}

/**
 * The buyer confirms they have taken ownership. This is what releases the money
 * to the seller — the admin still sends it by hand, but the deal is settled.
 */
export async function confirmClaimed(user: CurrentUser, dealId: string): Promise<DealResult> {
  const now = new Date();
  const open: DealStatus[] = ["credentials_released", "claiming"];

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, buyerId: true, sellerId: true, tradeKind: true, sellerConfirmedAt: true },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  // A cash deal turns on the buyer alone: the seller's side of the bargain is
  // the money, which the service is already holding.
  if (deal.tradeKind === "cash") {
    const result = await prisma.deal.updateMany({
      where: { id: dealId, buyerId: user.id, status: { in: open } },
      data: { status: "completed", buyerConfirmedAt: now, completedAt: now },
    });

    if (result.count !== 1) {
      return { ok: false, error: "This deal is not waiting for your confirmation." };
    }

    await creditReferralsForDeal(dealId);

    return { ok: true };
  }

  // A swap needs both. Neither party is protected by held money, so the deal
  // only closes once each has said they have the other's account.
  const isBuyer = deal.buyerId === user.id;
  const isSeller = deal.sellerId === user.id;

  if (!isBuyer && !isSeller) {
    return { ok: false, error: "This deal is not waiting for your confirmation." };
  }

  // Whether the OTHER side has already confirmed decides if this one closes the
  // deal. Read inside the same statement's WHERE clause below, so two
  // simultaneous confirmations cannot both see "the other has not confirmed"
  // and leave the deal open.
  const mine = isBuyer ? "buyerConfirmedAt" : "sellerConfirmedAt";
  const theirs = isBuyer ? "sellerConfirmedAt" : "buyerConfirmedAt";

  const closes = await prisma.deal.updateMany({
    where: {
      id: dealId,
      ...(isBuyer ? { buyerId: user.id } : { sellerId: user.id }),
      status: { in: open },
      [mine]: null,
      [theirs]: { not: null },
    },
    data: { status: "completed", [mine]: now, completedAt: now },
  });

  // This confirmation was the second one, so the deal just closed and the two
  // promoters are owed. Only on this branch: the first confirmation leaves the
  // deal open, and an open deal earns nobody anything.
  if (closes.count === 1) {
    await creditReferralsForDeal(dealId);

    return { ok: true };
  }

  // Otherwise this is the first confirmation: record it and wait for the other.
  const first = await prisma.deal.updateMany({
    where: {
      id: dealId,
      ...(isBuyer ? { buyerId: user.id } : { sellerId: user.id }),
      status: { in: open },
      [mine]: null,
    },
    data: { [mine]: now },
  });

  if (first.count !== 1) {
    return { ok: false, error: "This deal is not waiting for your confirmation." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

/** ADMIN. Records that the seller has actually been paid out. */
export async function markPayoutSent(
  admin: CurrentUser,
  dealId: string,
  reference: string,
): Promise<DealResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const result = await prisma.deal.updateMany({
    where: { id: dealId, status: "completed", payoutAt: null },
    data: { payoutAt: new Date(), payoutReference: reference },
  });

  if (result.count !== 1) {
    return { ok: false, error: "This deal is not a completed deal awaiting payout." };
  }

  return { ok: true };
}

/** ADMIN. Give the buyer their money back and end the deal. */
export async function refundDeal(admin: CurrentUser, dealId: string): Promise<DealResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const refundable: DealStatus[] = [
    "payment_submitted",
    "admin_verifying",
    "credentials_released",
    "claiming",
    "disputed",
  ];

  const result = await prisma.deal.updateMany({
    where: { id: dealId, status: { in: refundable } },
    data: { status: "refunded", refundedAt: new Date() },
  });

  if (result.count !== 1) {
    return { ok: false, error: "This deal cannot be refunded from its current state." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

/** Either party may call a deal off, but only before any money has moved. */
export async function cancelDeal(
  user: CurrentUser,
  dealId: string,
): Promise<DealResult> {
  const result = await prisma.deal.updateMany({
    where: {
      id: dealId,
      status: { in: PRE_PAYMENT_STATUSES },
      OR: [{ sellerId: user.id }, { buyerId: user.id }],
    },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      // Kill any outstanding invite so the code cannot be used afterwards.
      inviteCode: null,
    },
  });

  if (result.count !== 1) {
    return {
      ok: false,
      error: "This deal can no longer be cancelled here. Once payment is involved, open a dispute instead.",
    };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export type DealViewerRole = "seller" | "buyer" | "admin";

export type DealView = {
  id: string;
  reference: string;
  inviteCode: string | null;
  status: DealStatus;
  createdSide: DealSide;
  createdById: string;
  accountSummary: string;
  /** cash: money for an account. swap: an account for an account. */
  tradeKind: TradeKind;
  /** Swap only: the account the buyer is putting up. Null on a cash deal. */
  counterAccountSummary: string | null;
  game: string;
  platform: string | null;
  level: number | null;
  agreedPriceCents: number;
  feeCents: number;
  sellerPayoutCents: number;
  feeBps: number;
  currency: string;
  createdAt: Date;
  seller: { id: string; displayName: string } | null;
  buyer: { id: string; displayName: string } | null;
  /** Whether the account details have been deposited — never the details. */
  hasCredentials: boolean;
  credentialsUpdatedAt: Date | null;
  /** Swap only: the same, for the buyer's account. */
  hasCounterCredentials: boolean;
  counterCredentialsUpdatedAt: Date | null;

  // --- payment ---
  paymentMethod: PaymentMethod | null;
  paymentTxHash: string | null;
  paymentReference: string | null;
  paymentInstructionsSnapshot: string | null;
  paymentSubmittedAt: Date | null;
  paymentConfirmedAt: Date | null;

  // --- delivery and claim ---
  deliveryApprovedAt: Date | null;
  credentialsReleasedAt: Date | null;
  confirmationDeadline: Date | null;
  buyerConfirmedAt: Date | null;
  /** Swap only: a swap closes when both sides have confirmed. */
  sellerConfirmedAt: Date | null;

  // --- settlement ---
  completedAt: Date | null;
  refundedAt: Date | null;
  payoutAt: Date | null;
  payoutReference: string | null;

  /** Admin-only: the result of checking the account before release. */
  verification: { lastVerifiedAt: Date | null; note: string | null } | null;
};

/**
 * Loads a deal for someone entitled to see it: the two parties, or the admin.
 * Anyone else gets null, and the page turns that into a 404 — a stranger should
 * not be able to confirm that a given deal id exists.
 *
 * Note what is NOT selected: the credential ciphertext. Phase 2 has no reason to
 * put it in a page payload, so it never leaves the database.
 */
export async function loadDealForViewer(
  dealId: string,
  user: CurrentUser,
): Promise<{ deal: DealView; role: DealViewerRole } | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      reference: true,
      inviteCode: true,
      status: true,
      createdSide: true,
      createdById: true,
      accountSummary: true,
      tradeKind: true,
      counterAccountSummary: true,
      game: true,
      platform: true,
      level: true,
      agreedPriceCents: true,
      feeCents: true,
      sellerPayoutCents: true,
      feeBps: true,
      currency: true,
      createdAt: true,
      seller: { select: { id: true, displayName: true } },
      buyer: { select: { id: true, displayName: true } },
      paymentMethod: true,
      paymentTxHash: true,
      paymentReference: true,
      paymentInstructionsSnapshot: true,
      paymentSubmittedAt: true,
      paymentConfirmedAt: true,
      deliveryApprovedAt: true,
      credentialsReleasedAt: true,
      confirmationDeadline: true,
      buyerConfirmedAt: true,
      sellerConfirmedAt: true,
      completedAt: true,
      refundedAt: true,
      payoutAt: true,
      payoutReference: true,
      // updatedAt only — still never the ciphertext. Both rows on a swap, so
      // the page can tell each party whether the OTHER has deposited yet.
      credentials: {
        select: { side: true, updatedAt: true, lastVerifiedAt: true, verificationNote: true },
      },
    },
  });

  if (!deal) return null;

  const role: DealViewerRole | null =
    deal.seller?.id === user.id
      ? "seller"
      : deal.buyer?.id === user.id
        ? "buyer"
        : user.role === "admin"
          ? "admin"
          : null;

  if (!role) return null;

  // The seller's row: the only one a cash deal has, and the one carrying the
  // verification note on either kind.
  const { credentials, ...rest } = deal;
  const credential = credentials.find((row) => row.side === "seller") ?? null;
  const counterCredential = credentials.find((row) => row.side === "buyer") ?? null;

  return {
    role,
    deal: {
      ...rest,
      hasCredentials: credential !== null,
      credentialsUpdatedAt: credential?.updatedAt ?? null,
      // Swap only: whether the buyer has put their account up too. Both sides
      // need to see this — it is the thing each is waiting on the other for.
      hasCounterCredentials: counterCredential !== null,
      counterCredentialsUpdatedAt: counterCredential?.updatedAt ?? null,
      // The verification note is the admin's working record, not something the
      // two parties should read.
      verification:
        role === "admin" && credential
          ? { lastVerifiedAt: credential.lastVerifiedAt, note: credential.verificationNote }
          : null,
      // The invite code is a secret for the creator to pass on; nobody else
      // needs it, and the admin should not be able to join a deal by accident.
      inviteCode: deal.createdById === user.id ? deal.inviteCode : null,
    },
  };
}

/** Every deal this person is part of, newest first. */
export function listDealsForUser(userId: string) {
  return prisma.deal.findMany({
    where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reference: true,
      accountSummary: true,
      game: true,
      status: true,
      agreedPriceCents: true,
      sellerPayoutCents: true,
      currency: true,
      sellerId: true,
      tradeKind: true,
      createdAt: true,
    },
  });
}
