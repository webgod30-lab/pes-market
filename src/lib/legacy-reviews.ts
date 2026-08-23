// Historical customer reviews supplied by the site owner. SERVER ONLY.
//
// The source export contains names, ratings and comments, but no user IDs or
// deal IDs. These records therefore live in a separate database table instead
// of being turned into fabricated User/Deal/Review relationships.
import { prisma } from "@/lib/prisma";

export type LegacyCustomerReview = {
  id: string;
  sourceOrder: number;
  authorName: string;
  rating: number;
  comment: string;
};

export async function listLegacyCustomerReviews(take = 50): Promise<LegacyCustomerReview[]> {
  return prisma.legacyCustomerReview.findMany({
    orderBy: { sourceOrder: "desc" },
    take,
    select: { id: true, sourceOrder: true, authorName: true, rating: true, comment: true },
  });
}

export async function getLegacyCustomerReviewStats(): Promise<{ count: number; ratingSum: number }> {
  const aggregate = await prisma.legacyCustomerReview.aggregate({
    _count: { _all: true },
    _sum: { rating: true },
  });

  return {
    count: aggregate._count._all,
    ratingSum: aggregate._sum.rating ?? 0,
  };
}
