// The admin console's data layer. SERVER ONLY.
//
// Everything here assumes the caller is an admin and re-checks it anyway. These
// are the functions that can ban someone or move money outside the normal flow,
// so "the page already checked" is not good enough.
import { prisma } from "@/lib/prisma";
import { OPEN_STATUSES, PRE_PAYMENT_STATUSES } from "@/lib/deal-status";
import type { CurrentUser } from "@/lib/dal";
import type { DealStatus, Role } from "@/generated/prisma/client";

export type AdminResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Console overview
// ---------------------------------------------------------------------------

export type ConsoleStats = {
  paymentsToConfirm: number;
  deliveriesToApprove: number;
  payoutsToSend: number;
  buyersGoneQuiet: number;
  openDisputes: number;
  dealsInFlight: number;
  users: number;
  bannedUsers: number;
};

export async function getConsoleStats(now = new Date()): Promise<ConsoleStats> {
  const [
    paymentsToConfirm,
    deliveriesToApprove,
    payoutsToSend,
    buyersGoneQuiet,
    openDisputes,
    dealsInFlight,
    users,
    bannedUsers,
  ] = await Promise.all([
    prisma.deal.count({ where: { status: "payment_submitted" } }),
    prisma.deal.count({ where: { status: "admin_verifying" } }),
    prisma.deal.count({ where: { status: "completed", payoutAt: null } }),
    prisma.deal.count({
      where: {
        status: { in: ["credentials_released", "claiming"] },
        confirmationDeadline: { lt: now },
      },
    }),
    prisma.dispute.count({ where: { status: { in: ["open", "under_review"] } } }),
    prisma.deal.count({ where: { status: { in: OPEN_STATUSES } } }),
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
  ]);

  return {
    paymentsToConfirm,
    deliveriesToApprove,
    payoutsToSend,
    buyersGoneQuiet,
    openDisputes,
    dealsInFlight,
    users,
    bannedUsers,
  };
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export type DealFilter = "needs_action" | "open" | "all" | DealStatus;

/**
 * Browsable list of deals. `needs_action` is the default because that is what
 * an admin opening the console actually wants: the work, not the archive.
 */
export function listDealsForAdmin(filter: DealFilter, search: string, now = new Date()) {
  const trimmed = search.trim();

  const statusWhere =
    filter === "needs_action"
      ? {
          OR: [
            { status: "disputed" as DealStatus },
            { status: { in: ["payment_submitted", "admin_verifying"] as DealStatus[] } },
            { status: "completed" as DealStatus, payoutAt: null },
            {
              status: { in: ["credentials_released", "claiming"] as DealStatus[] },
              confirmationDeadline: { lt: now },
            },
          ],
        }
      : filter === "open"
        ? { status: { in: OPEN_STATUSES } }
        : filter === "all"
          ? {}
          : { status: filter };

  return prisma.deal.findMany({
    where: {
      ...statusWhere,
      ...(trimmed
        ? {
            OR: [
              { reference: { contains: trimmed, mode: "insensitive" as const } },
              { accountSummary: { contains: trimmed, mode: "insensitive" as const } },
              { seller: { displayName: { contains: trimmed, mode: "insensitive" as const } } },
              { buyer: { displayName: { contains: trimmed, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      accountSummary: true,
      status: true,
      agreedPriceCents: true,
      feeCents: true,
      sellerPayoutCents: true,
      currency: true,
      payoutAt: true,
      confirmationDeadline: true,
      createdAt: true,
      seller: { select: { displayName: true } },
      buyer: { select: { displayName: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export function listDisputesForAdmin(onlyOpen: boolean) {
  return prisma.dispute.findMany({
    where: onlyOpen ? { status: { in: ["open", "under_review"] } } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      openedBy: { select: { displayName: true } },
      deal: {
        select: {
          id: true,
          reference: true,
          status: true,
          agreedPriceCents: true,
          currency: true,
          seller: { select: { displayName: true } },
          buyer: { select: { displayName: true } },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: Date | null;
  createdAt: Date;
  dealsAsSeller: number;
  dealsAsBuyer: number;
  openDeals: number;
};

export async function listUsersForAdmin(search: string): Promise<AdminUserRow[]> {
  const trimmed = search.trim();

  const users = await prisma.user.findMany({
    where: trimmed
      ? {
          OR: [
            { email: { contains: trimmed, mode: "insensitive" } },
            { displayName: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ isBanned: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      isBanned: true,
      banReason: true,
      bannedAt: true,
      createdAt: true,
      _count: { select: { dealsAsSeller: true, dealsAsBuyer: true } },
    },
  });

  // Open-deal counts matter when deciding whether banning someone will strand
  // a trade that is already in progress.
  const openCounts = await prisma.deal.groupBy({
    by: ["sellerId", "buyerId"],
    where: { status: { in: OPEN_STATUSES } },
    _count: { _all: true },
  });

  const openByUser = new Map<string, number>();

  for (const row of openCounts) {
    for (const id of [row.sellerId, row.buyerId]) {
      if (id) openByUser.set(id, (openByUser.get(id) ?? 0) + row._count._all);
    }
  }

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isBanned: user.isBanned,
    banReason: user.banReason,
    bannedAt: user.bannedAt,
    createdAt: user.createdAt,
    dealsAsSeller: user._count.dealsAsSeller,
    dealsAsBuyer: user._count.dealsAsBuyer,
    openDeals: openByUser.get(user.id) ?? 0,
  }));
}

/**
 * Bans a user. They are signed out on their next request, because
 * src/lib/dal.ts re-reads the user row rather than trusting the session token.
 *
 * Two things are deliberately impossible: banning yourself (you would lock
 * yourself out of the console) and banning another admin (one compromised admin
 * account should not be able to remove the others).
 */
export async function banUser(
  admin: CurrentUser,
  userId: string,
  reason: string,
): Promise<AdminResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const trimmed = reason.trim();

  if (!trimmed) return { ok: false, error: "Give a reason — the user is told what it was." };

  if (userId === admin.id) {
    return { ok: false, error: "You cannot ban yourself." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isBanned: true },
  });

  if (!target) return { ok: false, error: "User not found." };

  if (target.role === "admin") {
    return { ok: false, error: "Admins cannot be banned from here. Change the role first." };
  }

  if (target.isBanned) return { ok: false, error: "That user is already banned." };

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, bannedAt: new Date(), banReason: trimmed },
  });

  return { ok: true };
}

export async function unbanUser(admin: CurrentUser, userId: string): Promise<AdminResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const result = await prisma.user.updateMany({
    where: { id: userId, isBanned: true },
    data: { isBanned: false, bannedAt: null, banReason: null },
  });

  if (result.count !== 1) return { ok: false, error: "That user is not banned." };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Force actions — the escape hatches
// ---------------------------------------------------------------------------

/**
 * Refunds a deal the buyer has already confirmed, provided the payout has not
 * gone out yet.
 *
 * The normal refund path (src/lib/deals.ts) deliberately stops at "completed",
 * because a completed deal is settled. This is the admin override for when it
 * turns out not to be — the account gets clawed back a day later, say. It
 * cannot touch a deal whose payout has already been sent, because at that point
 * the money is genuinely gone and there is nothing to reverse.
 */
export async function forceRefundCompleted(
  admin: CurrentUser,
  dealId: string,
): Promise<AdminResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const result = await prisma.deal.updateMany({
    where: { id: dealId, status: "completed", payoutAt: null },
    data: { status: "refunded", refundedAt: new Date() },
  });

  if (result.count !== 1) {
    return {
      ok: false,
      error: "Only a completed deal that has not been paid out can be force-refunded.",
    };
  }

  return { ok: true };
}

/** Kills a deal that has stalled before any money moved. */
export async function forceCancel(admin: CurrentUser, dealId: string): Promise<AdminResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const result = await prisma.deal.updateMany({
    where: { id: dealId, status: { in: PRE_PAYMENT_STATUSES } },
    data: { status: "cancelled", cancelledAt: new Date(), inviteCode: null },
  });

  if (result.count !== 1) {
    return {
      ok: false,
      error: "Only a deal with no money in it can be cancelled. Refund or resolve it instead.",
    };
  }

  return { ok: true };
}
