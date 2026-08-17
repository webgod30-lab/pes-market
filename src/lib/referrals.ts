// The referral program. SERVER ONLY.
//
// This is now the only place money enters the system, and it only ever flows
// outward. There is no commission on a swap — there is no price to take a
// percentage of — so nothing here is funded by a deal. Every credit written
// below is a cost.
//
// The rule, in one line: when a deal completes, each of the two traders earns
// $2 for the promoter whose code they signed up with. Never for themselves.
//
// Everything is derived from ReferralEarning rows. Nothing keeps a running
// total, for the same reason Withdrawal does not: a stored balance drifts away
// from the events behind it and cannot be re-derived once it has.
import { prisma } from "@/lib/prisma";
import { generateReferralCode, normaliseReferralCode } from "@/lib/ids";
import { DEMO_EMAIL_SUFFIXES } from "@/lib/demo-data";

/**
 * What one completed deal earns the trader's promoter.
 *
 * Snapshotted onto each ReferralEarning row at the moment it is written, so
 * changing this never revalues what a promoter has already earned and is
 * waiting to be paid.
 */
export const REFERRAL_REWARD_CENTS = 200;

/**
 * What a founding promoter earns instead, while their window is open.
 *
 * The point is not the extra $3. It is that a code issued early is worth more
 * than one issued later, which gives the first promoters a reason to actually
 * use theirs — and gives you a reason to follow up with the ones who have gone
 * quiet.
 */
export const FOUNDING_REWARD_CENTS = 500;

/** How long a founding promoter keeps the higher rate. */
export const FOUNDING_RATE_DAYS = 90;

/** How many promoters get it at all. Scarcity is the mechanism. */
export const FOUNDING_PLACES = 20;

/**
 * The balance a promoter has to reach before their FIRST payout.
 *
 * Deliberately low. At $2 a swap, a $40 threshold means twenty completed deals
 * before anybody sees a penny — and most promoters earn four dollars and quit
 * having never been paid, which teaches them the money was never real. One
 * cheap payout early is worth more than the fee it costs.
 */
export const FIRST_PAYOUT_CENTS = 1_000;

/**
 * The threshold for every payout after the first.
 *
 * Every payout is a manual transfer that costs a fee and somebody's time. Once
 * a promoter has been paid once and knows the money arrives, batching is fine.
 */
export const MINIMUM_PAYOUT_CENTS = 4_000;

export type ReferralResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Codes
// ---------------------------------------------------------------------------

/**
 * Mints a code that is not already taken.
 *
 * The loop is not paranoia about the odds — 31^6 is ~887 million — it is that
 * the alternative to retrying is failing somebody's registration. Uniqueness is
 * still enforced by the database; this only avoids the collision being the
 * user's problem.
 */
export async function mintReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateReferralCode();

    const taken = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    if (!taken) return code;
  }

  throw new Error("Could not mint an unused referral code after 8 attempts.");
}

export type Promoter = { id: string; displayName: string; referralCode: string };

/**
 * Finds the promoter a typed code belongs to.
 *
 * Banned promoters are refused rather than ignored: signing somebody up under a
 * banned account would quietly attach them to a person the site has already
 * removed, and the new user would never know why their promoter never got paid.
 */
export async function findPromoterByCode(rawCode: string): Promise<Promoter | null> {
  const code = normaliseReferralCode(rawCode);

  if (code === "" || code === "PES-") return null;

  const promoter = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, displayName: true, referralCode: true, isBanned: true },
  });

  if (!promoter || promoter.isBanned) return null;

  return {
    id: promoter.id,
    displayName: promoter.displayName,
    referralCode: promoter.referralCode,
  };
}

// ---------------------------------------------------------------------------
// Crediting
// ---------------------------------------------------------------------------

/**
 * Writes the $2 credits a newly completed deal owes.
 *
 * Safe to call more than once, and it has to be: a deal reaches "completed"
 * from an ordinary confirmation, from a dispute resolved in the seller's
 * favour, and from an admin forcing it through. The unique index on
 * (dealId, traderId) is what actually enforces "once"; `skipDuplicates` just
 * stops the second call being an error.
 *
 * Deliberately never throws for a business reason — a missing promoter is
 * normal, not a fault. It returns how many credits it wrote so a caller that
 * cares can log it.
 */
export async function creditReferralsForDeal(dealId: string): Promise<{ credited: number }> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      status: true,
      tradeKind: true,
      sellerId: true,
      buyerId: true,
      // referredBy, not just referredById: the rate depends on whether that
      // promoter's founding window is still open at the moment the deal
      // completes.
      seller: {
        select: { id: true, referredById: true, referredBy: { select: { foundingRateUntil: true } } },
      },
      buyer: {
        select: { id: true, referredById: true, referredBy: { select: { foundingRateUntil: true } } },
      },
    },
  });

  // Only a finished deal earns anything. Checked here rather than trusted from
  // the caller, so a mistake at a call site cannot pay out on an open deal.
  if (!deal || deal.status !== "completed") return { credited: 0 };

  // A deal from the retired cash flow earns nobody anything. Those closed
  // before this programme existed, and paying for them now would be inventing
  // a debt retroactively — which reconcileReferralCredits below would otherwise
  // do the first time it ran, for every archived deal at once.
  if (deal.tradeKind !== "swap") return { credited: 0 };

  const traders = [deal.seller, deal.buyer];

  const rows = traders.flatMap((trader) => {
    if (!trader?.referredById) return [];

    // A promoter does not earn from a deal they were personally a party to.
    // Without this, someone who introduced one friend can swap accounts back
    // and forth with that friend and pay themselves $2 a time — the credit is
    // meant for bringing somebody to the site, not for using it.
    const promoterIsTrading = traders.some((other) => other?.id === trader.referredById);

    if (promoterIsTrading) return [];

    // Resolved now, and stored. A founding window that closes tomorrow must not
    // retroactively devalue what was earned today, and the snapshot on the row
    // is what guarantees that — nothing ever recomputes an amount.
    const founding = trader.referredBy?.foundingRateUntil;
    const isFounding = founding !== null && founding !== undefined && founding > new Date();

    return [
      {
        promoterId: trader.referredById,
        traderId: trader.id,
        dealId: deal.id,
        amountCents: isFounding ? FOUNDING_REWARD_CENTS : REFERRAL_REWARD_CENTS,
      },
    ];
  });

  if (rows.length === 0) return { credited: 0 };

  const written = await prisma.referralEarning.createMany({ data: rows, skipDuplicates: true });

  return { credited: written.count };
}

/**
 * Writes credits for any completed deal that never got them.
 *
 * The safety net for the gap between "the deal is marked completed" and "the
 * credits are written", which are two statements and can therefore be
 * interrupted between. Without this the money would simply be lost, and nobody
 * would notice because the promoter has no way to know what they were owed.
 *
 * Idempotent, so it is safe to run on a schedule.
 */
export async function reconcileReferralCredits(limit = 500): Promise<{ scanned: number; credited: number }> {
  const deals = await prisma.deal.findMany({
    where: { status: "completed", tradeKind: "swap", referralEarnings: { none: {} } },
    orderBy: { completedAt: "asc" },
    take: limit,
    select: { id: true },
  });

  let credited = 0;

  for (const deal of deals) {
    credited += (await creditReferralsForDeal(deal.id)).credited;
  }

  return { scanned: deals.length, credited };
}

// ---------------------------------------------------------------------------
// Payout timing
// ---------------------------------------------------------------------------

/**
 * The next 1st of the month, in UTC.
 *
 * Requests can be made on any day once the balance is high enough; this is the
 * date the admin actually sends the batch, and it is shown to the promoter so
 * "when do I get paid" never needs asking. UTC rather than the viewer's zone,
 * so two people in different countries are told the same date.
 */
export function nextPayoutDate(from: Date = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
}

/** Whether today is a payout day, for the admin console's benefit. */
export function isPayoutDay(now: Date = new Date()): boolean {
  return now.getUTCDate() === 1;
}

// ---------------------------------------------------------------------------
// Founding promoters
// ---------------------------------------------------------------------------

/** How many founding places are still open. Zero once they are gone. */
export async function foundingPlacesLeft(): Promise<number> {
  const taken = await prisma.user.count({ where: { foundingRateUntil: { not: null } } });

  return Math.max(0, FOUNDING_PLACES - taken);
}

/**
 * The founding expiry for a promoter being approved right now, or null if the
 * places are gone.
 *
 * Counted at approval rather than reserved in advance, so an application that
 * sits in the queue for a week does not hold a place somebody else could have
 * used. Racing approvals can in principle both see the last place; the cost of
 * that is one extra founding promoter, which is not worth a lock.
 */
export async function claimFoundingPlace(now: Date = new Date()): Promise<Date | null> {
  if ((await foundingPlacesLeft()) <= 0) return null;

  return new Date(now.getTime() + FOUNDING_RATE_DAYS * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export type ReferralSummary = {
  referralCode: string;
  /** How many people signed up with this code. */
  signUps: number;
  /** How many of them have completed at least one deal. */
  activeSignUps: number;
  /** Every credit ever earned. */
  earnedCents: number;
  /** Credits earned this calendar month. */
  thisMonthCents: number;
  /** The promoter this user signed up under, if any. */
  promoter: { displayName: string; referralCode: string } | null;
  /** Set while this promoter is still on the founding rate. */
  foundingRateUntil: Date | null;
  currency: string;
};

export async function getReferralSummary(userId: string): Promise<ReferralSummary> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [user, signUps, activeSignUps, earned, thisMonth] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        foundingRateUntil: true,
        referredBy: { select: { displayName: true, referralCode: true } },
      },
    }),
    prisma.user.count({ where: { referredById: userId } }),
    prisma.user.count({
      where: {
        referredById: userId,
        // "Active" means they actually traded, which is the only thing that
        // ever pays. A sign-up who never opens a deal is worth showing
        // separately rather than counting as progress.
        referralCredits: { some: {} },
      },
    }),
    prisma.referralEarning.aggregate({
      where: { promoterId: userId },
      _sum: { amountCents: true },
    }),
    prisma.referralEarning.aggregate({
      where: { promoterId: userId, createdAt: { gte: monthStart } },
      _sum: { amountCents: true },
    }),
  ]);

  return {
    referralCode: user?.referralCode ?? "",
    signUps,
    activeSignUps,
    earnedCents: earned._sum.amountCents ?? 0,
    thisMonthCents: thisMonth._sum.amountCents ?? 0,
    promoter: user?.referredBy
      ? { displayName: user.referredBy.displayName, referralCode: user.referredBy.referralCode }
      : null,
    foundingRateUntil: user?.foundingRateUntil ?? null,
    currency: "USD",
  };
}

export type ReferralEarningRow = {
  id: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
  traderName: string;
  dealReference: string;
};

/**
 * The credits behind the balance, itemised.
 *
 * Same reasoning as the wallet's earnings list: a figure a promoter cannot
 * break down into the deals that produced it is a figure they have to take on
 * trust, and this service's whole pitch is not having to.
 */
export async function listReferralEarnings(userId: string, take = 100): Promise<ReferralEarningRow[]> {
  const rows = await prisma.referralEarning.findMany({
    where: { promoterId: userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      amountCents: true,
      currency: true,
      createdAt: true,
      trader: { select: { displayName: true } },
      deal: { select: { reference: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    amountCents: row.amountCents,
    currency: row.currency,
    createdAt: row.createdAt,
    traderName: row.trader.displayName,
    dealReference: row.deal.reference,
  }));
}

export type PublicPayoutRow = {
  id: string;
  /** First name and an initial. Never the full display name — see below. */
  promoterName: string;
  amountCents: number;
  currency: string;
  createdAt: Date;
};

/**
 * Recent credits, for the public feed on /promote.
 *
 * Two things this deliberately does not do.
 *
 * It does not show a full name. Reviews already show display names publicly,
 * so identity is not new exposure — but a name attached to an amount is income
 * data, and a promoter did not agree to have theirs published when they signed
 * up. First name and an initial proves a real person earned it without
 * publishing who earns what.
 *
 * And it excludes demo accounts outright. The seed and the deal bot both
 * generate credits, and a feed that broadcast those would be announcing
 * invented payouts as real ones on the page whose whole job is convincing
 * somebody the money exists — the worst possible place for it. Filtered by
 * reserved email domain, the same way lib/demo-data.ts recognises them, so it
 * holds even if the demo data is still sitting in the database.
 */
export async function listRecentPayouts(take = 8): Promise<PublicPayoutRow[]> {
  const rows = await prisma.referralEarning.findMany({
    where: {
      promoter: {
        AND: DEMO_EMAIL_SUFFIXES.map((suffix) => ({ email: { not: { endsWith: suffix } } })),
      },
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      amountCents: true,
      currency: true,
      createdAt: true,
      promoter: { select: { displayName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    promoterName: shortenName(row.promoter.displayName),
    amountCents: row.amountCents,
    currency: row.currency,
    createdAt: row.createdAt,
  }));
}

/** "Youssef Benali" -> "Youssef B."  ·  "Youssef" -> "Youssef" */
function shortenName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);

  if (parts.length < 2) return parts[0] ?? "Someone";

  return `${parts[0]} ${parts[parts.length - 1]!.charAt(0).toUpperCase()}.`;
}

export type ReferredUserRow = {
  id: string;
  displayName: string;
  joinedAt: Date;
  completedDeals: number;
  earnedCents: number;
};

/** Who this promoter brought in, and what each of them has earned them. */
export async function listReferredUsers(userId: string, take = 100): Promise<ReferredUserRow[]> {
  const users = await prisma.user.findMany({
    where: { referredById: userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      displayName: true,
      createdAt: true,
      // Credits this person generated, which is also the count of their
      // completed deals that paid — one row per completed deal per trader.
      referralCredits: { select: { amountCents: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    joinedAt: user.createdAt,
    completedDeals: user.referralCredits.length,
    earnedCents: user.referralCredits.reduce((sum, credit) => sum + credit.amountCents, 0),
  }));
}
