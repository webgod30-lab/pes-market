// A promoter's balance and payouts. SERVER ONLY.
//
// Money here is integer cents throughout, same as everywhere else — a float
// that is a hundredth of a cent out is a reconciliation nobody can finish.
//
// This used to be a seller's wallet, funded by the commission on cash deals.
// There are no cash deals and no commission any more, so a seller is owed
// nothing: they receive an account, not money. The only balance the site can
// owe is a promoter's, and it is made entirely of $2 referral credits.
//
// The balance is DERIVED, never stored:
//
//   earned    = every ReferralEarning row credited to this promoter
//   committed = every withdrawal that is requested or already sent
//   available = earned - committed
//
// Nothing writes a balance, so nothing can write a wrong one. A rejected or
// cancelled request simply stops being counted and the money is available
// again, with no compensating entry to forget.
import { prisma } from "@/lib/prisma";
import { MINIMUM_PAYOUT_CENTS, nextPayoutDate } from "@/lib/referrals";
import type { CurrentUser } from "@/lib/dal";
import type { PaymentMethod, WithdrawalStatus } from "@/generated/prisma/client";

export type WalletResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/** Requests that still have a claim on the balance. */
const COMMITTED: WithdrawalStatus[] = ["requested", "sent"];

/**
 * Nothing below this is paid out.
 *
 * Re-exported from lib/referrals rather than defined twice. The number is a
 * property of the referral program, and a copy of it here would be one edit
 * away from the form and the page promising different thresholds.
 */
export const MINIMUM_WITHDRAWAL_CENTS = MINIMUM_PAYOUT_CENTS;

export type Balance = {
  /** Every referral credit ever earned. */
  earnedCents: number;
  /** Reserved by an open request, or already paid out. */
  committedCents: number;
  /**
   * What can be withdrawn right now.
   *
   * Floored at zero. It can genuinely go negative: a completed deal that an
   * admin later force-refunds has its credits deleted, and the promoter may
   * already have been paid. The true figure is kept in `netCents` for the
   * admin, and future earnings pay the shortfall back before anything is
   * withdrawable again.
   */
  availableCents: number;
  /** The signed truth, including a shortfall. */
  netCents: number;
  /** Whether the balance has reached the payout minimum. */
  meetsMinimum: boolean;
  /** The next 1st of the month — when requests are actually sent. */
  nextPayoutAt: Date;
  currency: string;
};

export async function getBalance(userId: string): Promise<Balance> {
  const [earned, committed] = await Promise.all([
    prisma.referralEarning.aggregate({
      where: { promoterId: userId },
      _sum: { amountCents: true },
    }),
    prisma.withdrawal.aggregate({
      where: { promoterId: userId, status: { in: COMMITTED } },
      _sum: { amountCents: true },
    }),
  ]);

  const earnedCents = earned._sum?.amountCents ?? 0;
  const committedCents = committed._sum?.amountCents ?? 0;
  const netCents = earnedCents - committedCents;
  const availableCents = Math.max(0, netCents);

  return {
    earnedCents,
    committedCents,
    // Unchanged, and it must stay that way: this is the only figure
    // requestWithdrawal checks against.
    availableCents,
    netCents,
    meetsMinimum: availableCents >= MINIMUM_WITHDRAWAL_CENTS,
    nextPayoutAt: nextPayoutDate(),
    currency: "USD",
  };
}

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
    where: { promoterId: userId },
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
// Promoter actions
// ---------------------------------------------------------------------------

/**
 * Asks to be paid out.
 *
 * A request can be made on any day. It is *sent* on the 1st of the month, in
 * one batch — which is why nothing here checks the date. Blocking the button
 * for 30 days out of 31 would mean a promoter who happened to be busy on the
 * 1st waits another whole month for money they had already earned.
 *
 * One open request at a time. Two open requests could each pass the balance
 * check on their own and together exceed it — and a promoter cannot usefully
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
    where: { promoterId: user.id, status: "requested" },
    select: { id: true },
  });

  if (open) {
    return {
      ok: false,
      error: "You already have a payout waiting. It has to be sent or cancelled first.",
    };
  }

  const balance = await getBalance(user.id);

  if (balance.availableCents < MINIMUM_WITHDRAWAL_CENTS) {
    return {
      ok: false,
      error: "You need $40 in referral earnings before you can request a payout.",
    };
  }

  if (input.amountCents < MINIMUM_WITHDRAWAL_CENTS) {
    return { ok: false, error: "The smallest payout is $40." };
  }

  if (input.amountCents > balance.availableCents) {
    return { ok: false, error: "That is more than your available balance." };
  }

  const created = await prisma.withdrawal.create({
    data: {
      promoterId: user.id,
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
    where: { id: withdrawalId, promoterId: user.id, status: "requested" },
    data: { status: "cancelled", decidedAt: new Date() },
  });

  if (result.count !== 1) {
    return { ok: false, error: "That payout can no longer be cancelled." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export type AdminWithdrawalRow = WithdrawalView & {
  promoter: { id: string; displayName: string; email: string };
  /** The promoter's position at the time of viewing, to spot a shortfall. */
  promoterNetCents: number;
  /**
   * How much of this promoter's lifetime earnings came from the single person
   * who earned them the most.
   *
   * Not a rule, and nothing is blocked on it — it is a number for the admin to
   * look at before sending money. The program pays $2 per completed deal and
   * takes no commission to fund it, so a promoter whose entire balance came
   * from one account swapping repeatedly is the shape farming takes, and the
   * only place to notice it is here, before the transfer goes out.
   */
  topTraderShare: number;
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
      promoter: { select: { id: true, displayName: true, email: true } },
    },
  });

  // One lookup per distinct promoter rather than per row.
  const stats = new Map<string, { net: number; share: number }>();

  for (const promoterId of new Set(rows.map((row) => row.promoter.id))) {
    const [balance, byTrader] = await Promise.all([
      getBalance(promoterId),
      prisma.referralEarning.groupBy({
        by: ["traderId"],
        where: { promoterId },
        _sum: { amountCents: true },
      }),
    ]);

    const total = byTrader.reduce((sum, row) => sum + (row._sum?.amountCents ?? 0), 0);
    const top = byTrader.reduce((max, row) => Math.max(max, row._sum?.amountCents ?? 0), 0);

    stats.set(promoterId, {
      net: balance.netCents,
      share: total === 0 ? 0 : top / total,
    });
  }

  return rows.map((row) => ({
    ...row,
    promoterNetCents: stats.get(row.promoter.id)?.net ?? 0,
    topTraderShare: stats.get(row.promoter.id)?.share ?? 0,
  }));
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

  if (result.count !== 1) return { ok: false, error: "That payout is no longer open." };

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
    return { ok: false, error: "Give a reason — the promoter is shown it." };
  }

  const result = await prisma.withdrawal.updateMany({
    where: { id: withdrawalId, status: "requested" },
    data: { status: "rejected", decidedAt: new Date(), decidedById: admin.id, note: trimmed },
  });

  if (result.count !== 1) return { ok: false, error: "That payout is no longer open." };

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
 * Kept here rather than in either page so the promoter checking their request
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
 * How each payout state should look.
 *
 * The tone lives here rather than in the two pages that render it, because it
 * was written out identically in both and the pair would drift. The *labels*
 * deliberately stay in the pages: the promoter sees "Waiting to be sent" and
 * the admin sees "Waiting on you", which is the same state described from the
 * side that has to act on it.
 */
export const WITHDRAWAL_TONE: Record<WithdrawalStatus, "neutral" | "success" | "warning" | "danger"> = {
  requested: "warning",
  sent: "success",
  rejected: "danger",
  cancelled: "neutral",
};
