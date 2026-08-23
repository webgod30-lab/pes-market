import { getPublicReviewsPageData, type ReviewsPageEntry } from "@/lib/reviews";
import { getLegacyCustomerReviewStats, listLegacyCustomerReviews } from "@/lib/legacy-reviews";
import { getLocale } from "@/lib/locale-server";
import { REVIEWS_PAGE } from "@/lib/page-copy";
import { ReviewsFilter } from "@/components/reviews-filter";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { PageHeading } from "@/components/ui";

export const metadata = {
  title: "Reviews",
  description:
    "Common questions about escrowed game account trades: fees, timing, disputes, what happens if the seller takes the account back, and what this service does not cover.",
};

/** Reads live review data on every request, so it can never be prerendered or cached. */
export const dynamic = "force-dynamic";

/** Imported reviews load in batches of this size, so the wall never renders
 * the whole archive into one page's DOM. */
const LEGACY_BATCH = 30;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ legacyCount?: string }>;
}) {
  const locale = await getLocale();
  const copy = REVIEWS_PAGE[locale];
  const params = await searchParams;

  const [{ stats, reviews }, legacyStats] = await Promise.all([
    getPublicReviewsPageData(),
    getLegacyCustomerReviewStats(),
  ]);

  const requestedLegacyCount = Number(params.legacyCount) || LEGACY_BATCH;
  const legacyCount = Math.min(Math.max(requestedLegacyCount, LEGACY_BATCH), legacyStats.count);
  const legacyReviews = legacyCount > 0 ? await listLegacyCustomerReviews(legacyCount) : [];

  const importedEntries: ReviewsPageEntry[] = legacyReviews.map((review) => ({
    id: `legacy-${review.id}`,
    authorId: "",
    authorName: review.authorName,
    authorRole: "buyer" as const,
    dealReference: "",
    rating: review.rating,
    comment: review.comment,
    createdAt: null,
  }));

  // Imported reviews lead the wall. Appending them after the real reviews
  // buries the whole archive below a handful of recent deals, which is the
  // bug this page exists to fix.
  const combinedReviews = [...importedEntries, ...reviews];

  // Headline count and average cover every review that exists, not just the
  // ones rendered on this page load.
  const totalReviewCount = stats.reviewCount + legacyStats.count;
  const realRatingSum = stats.averageRating * stats.reviewCount;
  const combinedAverage =
    totalReviewCount > 0 ? (realRatingSum + legacyStats.ratingSum) / totalReviewCount : 0;

  const legacyRemaining = Math.max(legacyStats.count - legacyCount, 0);
  const nextLegacyCount = Math.min(legacyCount + LEGACY_BATCH, legacyStats.count);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <PageHeading title={copy.title} description={copy.intro} />

      <StatGrid columns={2}>
        <StatCard
          label={copy.averageRating}
          value={combinedAverage > 0 ? `${combinedAverage.toFixed(1)} / 5` : copy.noRating}
          caption={copy.reviewsSuffix(totalReviewCount)}
          icon="star"
        />
        <StatCard
          label={copy.settledClean}
          value={`${stats.settledCleanPercent}%`}
          caption={copy.settledCleanCaption}
          icon="shield"
        />
      </StatGrid>

      <ReviewsFilter
        reviews={combinedReviews}
        locale={locale}
        legacyRemaining={legacyRemaining}
        loadMoreHref={`/reviews?legacyCount=${nextLegacyCount}`}
      />
    </main>
  );
}
