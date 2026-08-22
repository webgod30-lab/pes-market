// Reviews and reputation. SERVER ONLY.
//
// In a marketplace, reputation is decoration. Here it is the one signal you have
// about a stranger before you commit to trading with them, so it is surfaced at
// the moment it matters — on the invite preview, before you join a deal.
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/dal";

export type Reputation = {
  /** Number of reviews received. */
  count: number;
  /** Mean rating, or null when nobody has reviewed them yet. */
  average: number | null;
  /** Deals they have completed as the seller. */
  completedSales: number;
  /** Deals they have completed as the buyer. */
  completedPurchases: number;
  /** Ratings received for their conduct as a seller. */
  asSeller: { count: number; average: number | null };
  /** ...and as a buyer. Someone can be a good seller and a difficult buyer. */
  asBuyer: { count: number; average: number | null };
};

export async function getReputation(userId: string): Promise<Reputation> {
  const [overall, bySide, completedSales, completedPurchases] = await Promise.all([
    prisma.review.aggregate({
      where: { subjectId: userId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["subjectSide"],
      where: { subjectId: userId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.deal.count({ where: { sellerId: userId, status: "completed" } }),
    prisma.deal.count({ where: { buyerId: userId, status: "completed" } }),
  ]);

  const seller = bySide.find((row) => row.subjectSide === "seller");
  const buyer = bySide.find((row) => row.subjectSide === "buyer");

  return {
    count: overall._count._all,
    average: overall._avg.rating,
    completedSales,
    completedPurchases,
    asSeller: { count: seller?._count._all ?? 0, average: seller?._avg.rating ?? null },
    asBuyer: { count: buyer?._count._all ?? 0, average: buyer?._avg.rating ?? null },
  };
}

/**
 * Reputation for many people at once, in a fixed number of queries.
 *
 * The admin user list needs a reputation per row. Calling getReputation() in a
 * loop meant four queries per user — 400 on a hundred-row page, which is slow
 * on a good database and fatal on a small one. This does three queries
 * regardless of how many users are asked for.
 */
export async function getReputationsFor(userIds: string[]): Promise<Map<string, Reputation>> {
  const empty = (): Reputation => ({
    count: 0,
    average: null,
    completedSales: 0,
    completedPurchases: 0,
    asSeller: { count: 0, average: null },
    asBuyer: { count: 0, average: null },
  });

  const result = new Map<string, Reputation>(userIds.map((id) => [id, empty()]));

  if (userIds.length === 0) return result;

  const [reviewRows, sales, purchases] = await Promise.all([
    // Sum and count rather than avg, so the overall average can be recombined
    // across sides exactly instead of averaging two averages.
    prisma.review.groupBy({
      by: ["subjectId", "subjectSide"],
      where: { subjectId: { in: userIds } },
      _sum: { rating: true },
      _count: { _all: true },
    }),
    prisma.deal.groupBy({
      by: ["sellerId"],
      where: { sellerId: { in: userIds }, status: "completed" },
      _count: { _all: true },
    }),
    prisma.deal.groupBy({
      by: ["buyerId"],
      where: { buyerId: { in: userIds }, status: "completed" },
      _count: { _all: true },
    }),
  ]);

  const totals = new Map<string, { sum: number; count: number }>();

  for (const row of reviewRows) {
    const rep = result.get(row.subjectId);
    if (!rep) continue;

    const count = row._count._all;
    const sum = row._sum.rating ?? 0;
    const side = row.subjectSide === "seller" ? rep.asSeller : rep.asBuyer;

    side.count = count;
    side.average = count > 0 ? sum / count : null;

    const running = totals.get(row.subjectId) ?? { sum: 0, count: 0 };
    running.sum += sum;
    running.count += count;
    totals.set(row.subjectId, running);
  }

  for (const [id, { sum, count }] of totals) {
    const rep = result.get(id);
    if (!rep) continue;
    rep.count = count;
    rep.average = count > 0 ? sum / count : null;
  }

  for (const row of sales) {
    if (!row.sellerId) continue;
    const rep = result.get(row.sellerId);
    if (rep) rep.completedSales = row._count._all;
  }

  for (const row of purchases) {
    if (!row.buyerId) continue;
    const rep = result.get(row.buyerId);
    if (rep) rep.completedPurchases = row._count._all;
  }

  return result;
}

export type ReviewView = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorName: string;
  subjectSide: string;
};

export function listReviewsFor(userId: string, take = 10): Promise<ReviewView[]> {
  return prisma.review
    .findMany({
      where: { subjectId: userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        subjectSide: true,
        author: { select: { displayName: true } },
      },
    })
    .then((rows) => rows.map((r) => ({ ...r, authorName: r.author.displayName })));
}

export type ReviewResult = { ok: true } | { ok: false; error: string };

/**
 * Either party rates the other once the deal is done — one review each.
 *
 * Deliberately restricted to completed deals: a review written mid-deal is
 * leverage ("give me a discount or I leave one star"), not information.
 */
export async function leaveReview(
  user: CurrentUser,
  dealId: string,
  rating: number,
  comment: string | null,
): Promise<ReviewResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be between 1 and 5." };
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, buyerId: true, sellerId: true, status: true },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  const isBuyer = deal.buyerId === user.id;
  const isSeller = deal.sellerId === user.id;

  if (!isBuyer && !isSeller) {
    return { ok: false, error: "Only the two people in this deal can review it." };
  }

  if (deal.status !== "completed") {
    return { ok: false, error: "You can review once the deal is completed." };
  }

  // You review the other side, and their side is what the rating describes.
  const subjectId = isBuyer ? deal.sellerId : deal.buyerId;
  const subjectSide = isBuyer ? "seller" : "buyer";

  if (!subjectId) return { ok: false, error: "This deal has nobody to review." };

  try {
    await prisma.review.create({
      data: {
        dealId,
        authorId: user.id,
        subjectId,
        subjectSide,
        rating,
        comment: comment?.trim() ? comment.trim() : null,
      },
    });
  } catch (error) {
    // The unique index on (dealId, authorId) catches a double submit.
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return { ok: false, error: "You have already reviewed this deal." };
    }
    throw error;
  }

  return { ok: true };
}

export type DealReview = {
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorName: string;
  subjectSide: string;
};

/** Both reviews on a deal, if they exist. */
export async function getReviewsForDeal(dealId: string): Promise<DealReview[]> {
  const rows = await prisma.review.findMany({
    where: { dealId },
    orderBy: { createdAt: "asc" },
    select: {
      rating: true,
      comment: true,
      createdAt: true,
      subjectSide: true,
      author: { select: { displayName: true } },
    },
  });

  return rows.map((row) => ({
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    authorName: row.author.displayName,
    subjectSide: row.subjectSide,
  }));
}

/** Whether this person still owes a review on this deal. */
export async function hasReviewed(dealId: string, authorId: string): Promise<boolean> {
  const existing = await prisma.review.findUnique({
    where: { dealId_authorId: { dealId, authorId } },
    select: { id: true },
  });

  return existing !== null;
}

// ---------------------------------------------------------------------------
// Public trust area
// ---------------------------------------------------------------------------

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorName: string;
  subjectName: string;
  subjectId: string;
  subjectSide: string;
};

/**
 * The public reviews wall.
 *
 * Exposes display names, ratings and comments only. Deliberately NOT the deal
 * reference, the account description or the amount — those are private between
 * the two parties, and a public feed of "who bought what for how much" would be
 * a gift to anyone targeting them.
 */
export async function listPublicReviews(take = 50): Promise<PublicReview[]> {
  const rows = await prisma.review.findMany({
    where: { comment: { not: null } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      subjectSide: true,
      author: { select: { displayName: true } },
      subject: { select: { id: true, displayName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    authorName: row.author.displayName,
    subjectName: row.subject.displayName,
    subjectId: row.subject.id,
    subjectSide: row.subjectSide,
  }));
}

export type TrustStats = {
  completedDeals: number;
  /** Total value of every completed deal, in cents. */
  protectedCents: number;
  reviews: number;
  averageRating: number | null;
  /** Share of completed deals that ended without a dispute. */
  cleanRate: number | null;
  traders: number;
  /**
   * When the most recent deal completed.
   *
   * The question every visitor to a small escrow site has and does not ask out
   * loud is "is anyone still here, or am I about to hand my credentials to a
   * dead service". Recency answers it before they consciously form it. Once
   * per-review dates are coarsened to the month, this is the only thing left
   * carrying that signal — so it moves to the top of the page.
   */
  lastCompletedAt: Date | null;
};

/** Headline numbers for the public trust page and the landing page. */
export async function getTrustStats(): Promise<TrustStats> {
  const [completedDeals, dealValue, reviewAgg, disputedDeals, traders, lastCompleted] = await Promise.all([
    prisma.deal.count({ where: { status: "completed" } }),
    // What escrow actually did: money that passed through and came out the
    // other side. For a service whose whole promise is holding funds safely,
    // this says more than any other figure on the page.
    prisma.deal.aggregate({
      where: { status: "completed" },
      _sum: { agreedPriceCents: true },
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
    prisma.deal.count({ where: { disputes: { some: {} } } }),
    prisma.user.count({ where: { role: "user" } }),
    prisma.deal.findFirst({
      // `completedAt: not null` is load-bearing, not defensive.
      //
      // Postgres sorts NULLs FIRST on a DESC order, so a single completed deal
      // with no timestamp — a row forced through by an admin, or one closed
      // before the column was populated — sorts ahead of every real date and
      // makes this return null. The page then silently drops its recency line
      // and shows nothing, which is exactly the signal it exists to carry.
      where: { status: "completed", completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),
  ]);

  const totalSettled = completedDeals + disputedDeals;

  return {
    completedDeals,
    protectedCents: dealValue._sum.agreedPriceCents ?? 0,
    reviews: reviewAgg._count._all,
    averageRating: reviewAgg._avg.rating,
    cleanRate: totalSettled > 0 ? completedDeals / totalSettled : null,
    traders,
    lastCompletedAt: lastCompleted?.completedAt ?? null,
  };
}

export type ReviewsPageStats = {
  averageRating: number;
  reviewCount: number;
  completedDeals: number;
  settledCleanPercent: number;
};

export type ReviewsPageEntry = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "buyer" | "seller";
  dealReference: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

/** Data for the public "/reviews" wall: headline stats plus recent reviews. */
export async function getPublicReviewsPageData(): Promise<{
  stats: ReviewsPageStats;
  reviews: ReviewsPageEntry[];
}> {
  const [reviews, completedDeals, disputedDeals] = await Promise.all([
    prisma.review.findMany({
      where: { deal: { status: "completed" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        subjectSide: true,
        author: { select: { id: true, displayName: true } },
        deal: { select: { reference: true } },
      },
    }),
    prisma.deal.count({ where: { status: "completed" } }),
    prisma.deal.count({ where: { status: "completed", disputes: { some: {} } } }),
  ]);

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

  const settledCleanPercent =
    completedDeals > 0
      ? Math.round(((completedDeals - disputedDeals) / completedDeals) * 100)
      : 0;

  return {
    stats: { averageRating, reviewCount, completedDeals, settledCleanPercent },
    reviews: reviews.map((r) => ({
      id: r.id,
      authorId: r.author.id,
      authorName: r.author.displayName,
      // subjectSide records who was reviewed, so the author took the other side.
      authorRole: r.subjectSide === "seller" ? "buyer" : "seller",
      dealReference: r.deal.reference,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  };
}

export type PublicProfile = {
  id: string;
  displayName: string;
  joinedAt: Date;
  reputation: Reputation;
  reviews: ReviewView[];
};

/** A person's public record. No email, no deal details. */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const user = await prisma.user.findFirst({
    // Banned people are hidden rather than shown with a badge: a public profile
    // is a marketing surface, not a punishment board.
    where: { id: userId, isBanned: false },
    select: { id: true, displayName: true, createdAt: true },
  });

  if (!user) return null;

  const [reputation, reviews] = await Promise.all([
    getReputation(user.id),
    listReviewsFor(user.id, 25),
  ]);

  return {
    id: user.id,
    displayName: user.displayName,
    joinedAt: user.createdAt,
    reputation,
    reviews,
  };
}
