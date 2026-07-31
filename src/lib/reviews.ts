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
  reviews: number;
  averageRating: number | null;
  /** Share of completed deals that ended without a dispute. */
  cleanRate: number | null;
  traders: number;
};

/** Headline numbers for the public trust page and the landing page. */
export async function getTrustStats(): Promise<TrustStats> {
  const [completedDeals, reviewAgg, disputedDeals, traders] = await Promise.all([
    prisma.deal.count({ where: { status: "completed" } }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
    prisma.deal.count({ where: { disputes: { some: {} } } }),
    prisma.user.count({ where: { role: "user" } }),
  ]);

  const totalSettled = completedDeals + disputedDeals;

  return {
    completedDeals,
    reviews: reviewAgg._count._all,
    averageRating: reviewAgg._avg.rating,
    cleanRate: totalSettled > 0 ? completedDeals / totalSettled : null,
    traders,
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
