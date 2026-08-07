// The seller's balance and withdrawals. SERVER ONLY.
//
// Money here is integer cents throughout, same as everywhere else — a float
// that is a hundredth of a cent out is a reconciliation nobody can finish.
//
// The balance is DERIVED, never stored:
//
//   earned    = every completed deal where this user was the seller
//   committed = every withdrawal that is requested or already sent
//   available = earned - committed
//
// Nothing writes a balance, so nothing can write a wrong one. A rejected or
// cancelled request simply stops being counted and the money is available
// again, with no compensating entry to forget.
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/dal";
import type { DealStatus, PaymentMethod, WithdrawalStatus } from "@/generated/prisma/client";

export type WalletResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/** Requests that still have a claim on the balance. */
const COMMITTED: WithdrawalStatus[] = ["requested", "sent"];

/** Nothing smaller is worth a manual transfer and its fee. */
export const MINIMUM_WITHDRAWAL_CENTS = 500;

export type Balance = {
  /** Everything ever earned from settled deals. */
  earnedCents: number;
  /** Reserved by an open request, or already paid out. */
  committedCents: number;
  /**
   * What can be withdrawn right now.
   *
   * Floored at zero. It can genuinely go negative: a deal force-refunded after
   * the seller has already withdrawn stops counting as earned, and the money
   * has gone. The true figure is kept in `netCents` for the admin, and future
   * earnings pay the shortfall back before anything is withdrawable again.
   */
  availableCents: number;
  /** The signed truth, including a shortfall. */
  netCents: number;
  /**
   * Money the admin is already holding on deals that have not finished.
   *
   * Deliberately NOT part of availableCents, and nothing below reads it when
   * deciding what may be withdrawn — it exists so a seller can see that the
   * buyer's payment has landed, which is the whole reassurance escrow is meant
   * to provide. They previously saw a zero balance from the moment they handed
   * over the account until the buyer confirmed, which reads exactly like the
   * money not existing.
   */
  pendingCents: number;
  /**
   * Held, but frozen by a dispute. Kept apart from pendingCents because it may
   * yet be refunded to the buyer — calling it "pending" would promise it.
   */
  frozenCents: number;
  currency: string;
};

/**
 * Deals where the buyer's money is confirmed and held, and the deal is still
 * running. `paymentConfirmedAt` is the gate rather than the status alone: a
 * buyer clicking "I have paid" is not the admin confirming it arrived.
 */
const HELD_IN_FLIGHT: DealStatus[] = ["admin_verifying", "credentials_released", "claiming"];

export async function getBalance(userId: string): Promise<Balance> {
  const [earned, committed, pending, frozen] = await Promise.all([
    // payoutAt marks a deal settled the old way, paid per-deal before wallets
    // existed. Counting those would credit money the seller already has.
    prisma.deal.aggregate({
      where: { sellerId: userId, status: "completed", payoutAt: null },
      _sum: { sellerPayoutCents: true },
    }),
    prisma.withdrawal.aggregate({
      where: { sellerId: userId, status: { in: COMMITTED } },
      _sum: { amountCents: true },
    }),
    prisma.deal.aggregate({
      where: {
        sellerId: userId,
        status: { in: HELD_IN_FLIGHT },
        paymentConfirmedAt: { not: null },
      },
      _sum: { sellerPayoutCents: true },
    }),
    prisma.deal.aggregate({
      where: { sellerId: userId, status: "disputed", paymentConfirmedAt: { not: null } },
      _sum: { sellerPayoutCents: true },
    }),
  ]);

  const earnedCents = earned._sum.sellerPayoutCents ?? 0;
  const committedCents = committed._sum.amountCents ?? 0;
  const netCents = earnedCents - committedCents;

  return {
    earnedCents,
    committedCents,
    // Unchanged, and it must stay that way: this is the only figure
    // requestWithdrawal checks against.
    availableCents: Math.max(0, netCents),
    netCents,
    pendingCents: pending._sum.sellerPayoutCents ?? 0,
    frozenCents: frozen._sum.sellerPayoutCents ?? 0,
    currency: "USD",
  };
}

export type PendingRow = {
  dealId: string;
  reference: string;
  accountSummary: string;
  amountCents: number;
  currency: string;
  status: DealStatus;
  /** What the seller is waiting on before this becomes withdrawable. */
  waitingOn: string;
};

const WAITING_ON: Partial<Record<DealStatus, string>> = {
  admin_verifying: "Admin is checking the account",
  credentials_released: "Buyer is claiming the account",
  claiming: "Buyer has it — waiting for them to confirm",
  disputed: "Frozen by a dispute",
};

/**
 * The deals behind pendingCents, itemised.
 *
 * Same reasoning as listEarnings: a figure a seller cannot break down into the
 * deals that produced it is a figure they have to take on trust, and this is a
 * service whose entire pitch is not having to.
 */
export async function listPending(userId: string): Promise<PendingRow[]> {
  const deals = await prisma.deal.findMany({
    where: {
      sellerId: userId,
      status: { in: [...HELD_IN_FLIGHT, "disputed"] },
      paymentConfirmedAt: { not: null },
    },
    orderBy: { paymentConfirmedAt: "desc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      accountSummary: true,
      sellerPayoutCents: true,
      currency: true,
      status: true,
    },
  });

  return deals.map((deal) => ({
    dealId: deal.id,
    reference: deal.reference,
    accountSummary: deal.accountSummary,
    amountCents: deal.sellerPayoutCents,
    currency: deal.currency,
    status: deal.status,
    waitingOn: WAITING_ON[deal.status] ?? "In progress",
  }));
}

export type EarningRow = {
  dealId: string;
  reference: string;
  accountSummary: string;
  amountCents: number;
  currency: string;
  completedAt: Date | null;
};

/** What each settled deal contributed, so the balance can be checked by hand. */
export async function listEarnings(userId: string): Promise<EarningRow[]> {
  const deals = await prisma.deal.findMany({
    where: { sellerId: userId, status: "completed", payoutAt: null },
    orderBy: { completedAt: "desc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      accountSummary: true,
      sellerPayoutCents: true,
      currency: true,
      completedAt: true,
    },
  });

  return deals.map((deal) => ({
    dealId: deal.id,
    reference: deal.reference,
    accountSummary: deal.accountSummary,
    amountCents: deal.sellerPayoutCents,
    currency: deal.currency,
    completedAt: deal.completedAt,
  }));
}

/**
 * A payout destination, discriminated the same way the form and the validation
 * schema are — so a bank transfer cannot be built without a bank, and a crypto
 * payout cannot be built without a network.
 */
export type WithdrawalRequest = { amountCents: number; destinationName: string; destinationAccount: string } & (
  | { method: "crypto"; destinationNetwork: string }
  | { method: "bank_transfer"; destinationBank: string; destinationBic?: string }
  | { method: "card"; destinationProvider: string }
);

export type WithdrawalView = {
  id: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  destinationName: string;
  destinationAccount: string;
  destinationNetwork: string | null;
  destinationBank: string | null;
  destinationBic: string | null;
  destinationProvider: string | null;
  status: WithdrawalStatus;
  requestedAt: Date;
  decidedAt: Date | null;
  note: string | null;
};

export function listWithdrawals(userId: string): Promise<WithdrawalView[]> {
  return prisma.withdrawal.findMany({
    where: { sellerId: userId },
    orderBy: { requestedAt: "desc" },
    take: 50,
    select: {
      id: true,
      amountCents: true,
      currency: true,
      method: true,
      destinationName: true,
      destinationAccount: true,
      destinationNetwork: true,
      destinationBank: true,
      destinationBic: true,
      destinationProvider: true,
      status: true,
      requestedAt: true,
      decidedAt: true,
      note: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Seller actions
// ---------------------------------------------------------------------------

/**
 * Asks to be paid out.
 *
 * One open request at a time. Two open requests could each pass the balance
 * check on their own and together exceed it — and the seller cannot usefully
 * tell two pending payouts apart anyway.
 */
export async function requestWithdrawal(
  user: CurrentUser,
  input: WithdrawalRequest,
): Promise<WalletResult<{ withdrawalId: string }>> {
  const destinationName = input.destinationName.trim();
  const destinationAccount = input.destinationAccount.trim();

  if (!destinationName || !destinationAccount) {
    return { ok: false, error: "Say who the money is going to, and where." };
  }

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, error: "Enter an amount to withdraw." };
  }

  const open = await prisma.withdrawal.findFirst({
    where: { sellerId: user.id, status: "requested" },
    select: { id: true },
  });

  if (open) {
    return {
      ok: false,
      error: "You already have a withdrawal waiting. It has to be sent or cancelled first.",
    };
  }

  const balance = await getBalance(user.id);

  if (balance.availableCents < MINIMUM_WITHDRAWAL_CENTS) {
    return { ok: false, error: "There is not enough in your balance to withdraw yet." };
  }

  if (input.amountCents < MINIMUM_WITHDRAWAL_CENTS) {
    return { ok: false, error: "That is below the minimum withdrawal." };
  }

  if (input.amountCents > balance.availableCents) {
    return { ok: false, error: "That is more than your available balance." };
  }

  const created = await prisma.withdrawal.create({
    data: {
      sellerId: user.id,
      amountCents: input.amountCents,
      method: input.method,
      destinationName,
      destinationAccount,
      // Each method only carries its own fields, so a bank payout cannot end
      // up storing a network and a crypto one cannot store a BIC.
      destinationNetwork: input.method === "crypto" ? input.destinationNetwork.trim() : null,
      destinationBank: input.method === "bank_transfer" ? input.destinationBank.trim() : null,
      destinationBic:
        input.method === "bank_transfer" ? input.destinationBic?.trim() || null : null,
      destinationProvider: input.method === "card" ? input.destinationProvider.trim() : null,
    },
    select: { id: true },
  });

  // Re-check after writing. Two requests submitted at the same instant can both
  // pass the check above, and the money must not be committed twice — so the
  // loser is rolled back rather than left over-committing the balance.
  const settled = await getBalance(user.id);

  if (settled.netCents < 0) {
    await prisma.withdrawal.deleteMany({ where: { id: created.id, status: "requested" } });

    return { ok: false, error: "That is more than your available balance." };
  }

  return { ok: true, withdrawalId: created.id };
}

/** Pulls a request back before the admin has acted on it. */
export async function cancelWithdrawal(
  user: CurrentUser,
  withdrawalId: string,
): Promise<WalletResult> {
  const result = await prisma.withdrawal.updateMany({
    where: { id: withdrawalId, sellerId: user.id, status: "requested" },
    data: { status: "cancelled", decidedAt: new Date() },
  });

  if (result.count !== 1) {
    return { ok: false, error: "That withdrawal can no longer be cancelled." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export type AdminWithdrawalRow = WithdrawalView & {
  seller: { id: string; displayName: string; email: string };
  /** The seller's position at the time of viewing, to spot a shortfall. */
  sellerNetCents: number;
};

export async function listWithdrawalsForAdmin(
  onlyOpen: boolean,
): Promise<AdminWithdrawalRow[]> {
  const rows = await prisma.withdrawal.findMany({
    where: onlyOpen ? { status: "requested" } : {},
    orderBy: { requestedAt: "asc" },
    take: 100,
    select: {
      id: true,
      amountCents: true,
      currency: true,
      method: true,
      destinationName: true,
      destinationAccount: true,
      destinationNetwork: true,
      destinationBank: true,
      destinationBic: true,
      destinationProvider: true,
      status: true,
      requestedAt: true,
      decidedAt: true,
      note: true,
      seller: { select: { id: true, displayName: true, email: true } },
    },
  });

  // One balance lookup per distinct seller rather than per row.
  const balances = new Map<string, number>();

  for (const sellerId of new Set(rows.map((r) => r.seller.id))) {
    balances.set(sellerId, (await getBalance(sellerId)).netCents);
  }

  return rows.map((row) => ({ ...row, sellerNetCents: balances.get(row.seller.id) ?? 0 }));
}

export function countPendingWithdrawals(): Promise<number> {
  return prisma.withdrawal.count({ where: { status: "requested" } });
}

/** ADMIN. The transfer has gone out. */
export async function markWithdrawalSent(
  admin: CurrentUser,
  withdrawalId: string,
  reference: string,
): Promise<WalletResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const trimmed = reference.trim();

  if (!trimmed) {
    return { ok: false, error: "Record the transfer reference — it is the proof it was sent." };
  }

  // Conditional on still being open, so a double submission cannot mark the
  // same payout sent twice.
  const result = await prisma.withdrawal.updateMany({
    where: { id: withdrawalId, status: "requested" },
    data: { status: "sent", decidedAt: new Date(), decidedById: admin.id, note: trimmed },
  });

  if (result.count !== 1) return { ok: false, error: "That withdrawal is no longer open." };

  return { ok: true };
}

/** ADMIN. Refuse it and hand the money back to the balance. */
export async function rejectWithdrawal(
  admin: CurrentUser,
  withdrawalId: string,
  reason: string,
): Promise<WalletResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const trimmed = reason.trim();

  if (!trimmed) {
    return { ok: false, error: "Give a reason — the seller is shown it." };
  }

  const result = await prisma.withdrawal.updateMany({
    where: { id: withdrawalId, status: "requested" },
    data: { status: "rejected", decidedAt: new Date(), decidedById: admin.id, note: trimmed },
  });

  if (result.count !== 1) return { ok: false, error: "That withdrawal is no longer open." };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export type DestinationField = {
  label: string;
  value: string;
  /** Set for anything meant to be read character by character or copied. */
  mono?: boolean;
};

/**
 * A destination broken into labelled lines, in the order someone filling in a
 * transfer form needs them.
 *
 * Kept here rather than in either page so the seller checking their request
 * and the admin sending the money are looking at the same thing, labelled the
 * same way. A mismatch between those two views is how money goes astray.
 */
export function destinationFields(withdrawal: {
  method: PaymentMethod;
  destinationName: string;
  destinationAccount: string;
  destinationNetwork: string | null;
  destinationBank: string | null;
  destinationBic: string | null;
  destinationProvider: string | null;
}): DestinationField[] {
  const name: DestinationField = { label: "Name on the account", value: withdrawal.destinationName };

  if (withdrawal.method === "crypto") {
    return [
      { label: "Wallet address", value: withdrawal.destinationAccount, mono: true },
      { label: "Network", value: withdrawal.destinationNetwork ?? "—", mono: true },
      name,
    ];
  }

  if (withdrawal.method === "bank_transfer") {
    return [
      name,
      { label: "IBAN / account number", value: withdrawal.destinationAccount, mono: true },
      { label: "Bank", value: withdrawal.destinationBank ?? "—" },
      ...(withdrawal.destinationBic
        ? [{ label: "SWIFT / BIC", value: withdrawal.destinationBic, mono: true }]
        : []),
    ];
  }

  return [
    { label: "Service", value: withdrawal.destinationProvider ?? "—" },
    { label: "Email or handle", value: withdrawal.destinationAccount, mono: true },
    name,
  ];
}

/**
 * How each withdrawal state should look.
 *
 * The tone lives here rather than in the two pages that render it, because it
 * was written out identically in both and the pair would drift. The *labels*
 * deliberately stay in the pages: the seller sees "Waiting to be sent" and the
 * admin sees "Waiting on you", which is the same state described from the side
 * that has to act on it.
 */
export const WITHDRAWAL_TONE: Record<WithdrawalStatus, "neutral" | "success" | "warning" | "danger"> = {
  requested: "warning",
  sent: "success",
  rejected: "danger",
  cancelled: "neutral",
};
