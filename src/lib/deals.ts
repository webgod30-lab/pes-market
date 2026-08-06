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
import { defaultFeeBps, splitDealMoney } from "@/lib/fees";
import { PRE_PAYMENT_STATUSES } from "@/lib/deal-status";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/escrow-flow";
import type { CurrentUser } from "@/lib/dal";
import type { DealSide, DealStatus, PaymentMethod } from "@/generated/prisma/client";

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
  agreedPriceCents: number;
};

export async function createDeal(
  input: CreateDealInput,
): Promise<DealResult<{ dealId: string; reference: string; inviteCode: string }>> {
  // The fee rate is copied onto the deal now. Changing your rate later must not
  // alter terms the two parties have already agreed to.
  const money = splitDealMoney(input.agreedPriceCents, defaultFeeBps());

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
          game: input.game,
          platform: input.platform,
          level: input.level,
          agreedPriceCents: money.agreedPriceCents,
          currency: "USD",
          feeBps: money.feeBps,
          feeCents: money.feeCents,
          sellerPayoutCents: money.sellerPayoutCents,
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
    select: { id: true, sellerId: true, status: true },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  if (deal.sellerId !== user.id) {
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

  // Both writes together: the deal must never claim credentials exist without
  // the row, or move to awaiting_payment without them.
  await prisma.$transaction([
    prisma.credential.upsert({
      where: { dealId: deal.id },
      update: { ciphertext },
      create: { dealId: deal.id, ciphertext },
    }),
    prisma.deal.updateMany({
      where: { id: deal.id, sellerId: user.id, status: { in: editable } },
      data: { status: "awaiting_payment" },
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
    select: { id: true, buyerId: true, status: true, credential: { select: { id: true } } },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  if (deal.buyerId !== user.id) {
    return { ok: false, error: "Only the buyer can submit payment for this deal." };
  }

  // Paying before the account is in escrow would defeat the point.
  if (!deal.credential) {
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
): Promise<DealResult<{ credentials: CredentialData }>> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const credential = await prisma.credential.findUnique({
    where: { dealId },
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
): Promise<DealResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const credential = await prisma.credential.findUnique({
    where: { dealId },
    select: { id: true },
  });

  if (!credential) return { ok: false, error: "No account details to verify." };

  await prisma.credential.update({
    where: { dealId },
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
    select: { id: true, status: true, credential: { select: { ciphertext: true } } },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  if (!deal.credential) {
    return { ok: false, error: "There are no account details to release." };
  }

  const deadline = new Date(Date.now() + CONFIRMATION_WINDOW_HOURS * 60 * 60 * 1000);

  const result = await prisma.deal.updateMany({
    where: { id: dealId, status: "admin_verifying" },
    data: {
      status: "credentials_released",
      deliveryApprovedAt: new Date(),
      deliveryApprovedById: admin.id,
      deliveredCiphertext: deal.credential.ciphertext,
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
 * The buyer reads the account details. Moves the deal to `claiming` on first
 * view, which is the audit point for "the buyer has had them".
 *
 * Reads the delivered snapshot, not the live credential row — the buyer must
 * see exactly what was approved.
 */
export async function revealCredentialsToBuyer(
  user: CurrentUser,
  dealId: string,
): Promise<DealResult<{ credentials: CredentialData }>> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, buyerId: true, status: true, deliveredCiphertext: true },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  if (deal.buyerId !== user.id) return { ok: false, error: "Only the buyer can view these." };

  const readable: DealStatus[] = ["credentials_released", "claiming", "completed", "disputed"];

  if (!readable.includes(deal.status) || !deal.deliveredCiphertext) {
    return { ok: false, error: "The account details have not been released yet." };
  }

  // First view starts the claiming stage.
  if (deal.status === "credentials_released") {
    await prisma.deal.updateMany({
      where: { id: dealId, buyerId: user.id, status: "credentials_released" },
      data: { status: "claiming" },
    });
  }

  return { ok: true, credentials: decryptCredentials(deal.deliveredCiphertext) };
}

/**
 * The buyer confirms they have taken ownership. This is what releases the money
 * to the seller — the admin still sends it by hand, but the deal is settled.
 */
export async function confirmClaimed(user: CurrentUser, dealId: string): Promise<DealResult> {
  const now = new Date();

  const result = await prisma.deal.updateMany({
    where: {
      id: dealId,
      buyerId: user.id,
      status: { in: ["credentials_released", "claiming"] },
    },
    data: { status: "completed", buyerConfirmedAt: now, completedAt: now },
  });

  if (result.count !== 1) {
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
      completedAt: true,
      refundedAt: true,
      payoutAt: true,
      payoutReference: true,
      // updatedAt only — still never the ciphertext.
      credential: {
        select: { updatedAt: true, lastVerifiedAt: true, verificationNote: true },
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

  const { credential, ...rest } = deal;

  return {
    role,
    deal: {
      ...rest,
      hasCredentials: credential !== null,
      credentialsUpdatedAt: credential?.updatedAt ?? null,
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
      createdAt: true,
    },
  });
}
