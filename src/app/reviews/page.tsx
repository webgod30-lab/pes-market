import { getPublicReviewsPageData } from "@/lib/reviews";
import { listLegacyCustomerReviews } from "@/lib/legacy-reviews";
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

export default async function ReviewsPage() {
  const locale = await getLocale();
  const copy = REVIEWS_PAGE[locale];
  const [{ stats, reviews }, legacyReviews] = await Promise.all([
    getPublicReviewsPageData(),
    listLegacyCustomerReviews(25),
  ]);

  const importedEntries = legacyReviews.map((review) => ({
    id: review.id,
    authorId: "",
    authorName: review.authorName,
    authorRole: "buyer" as const,
    dealReference: "",
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date(0),
  }));

  const combinedReviews = [...reviews.slice(0, 25), ...importedEntries].slice(0, 50);
  const combinedAverage =
    combinedReviews.length > 0
      ? combinedReviews.reduce((sum, review) => sum + review.rating, 0) / combinedReviews.length
      : 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <PageHeading title={copy.title} description={copy.intro} />

      <StatGrid columns={3}>
        <StatCard
          label={copy.averageRating}
          value={combinedAverage > 0 ? `${combinedAverage.toFixed(1)} / 5` : copy.noRating}
          caption={copy.reviewsSuffix(combinedReviews.length)}
          icon="star"
        />
        <StatCard
          label={copy.dealsCompleted}
          value={stats.completedDeals}
          caption={copy.dealsCompletedCaption}
          icon="folder"
        />
        <StatCard
          label={copy.settledClean}
          value={`${stats.settledCleanPercent}%`}
          caption={copy.settledCleanCaption}
          icon="shield"
        />
      </StatGrid>

      <ReviewsFilter reviews={combinedReviews} locale={locale} />
    </main>
  );
}
