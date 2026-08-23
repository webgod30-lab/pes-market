import { headers } from "next/headers";
import { getLocale } from "@/lib/locale-server";
import type { Locale } from "@/lib/locale";

import { getCurrentUserQuietly } from "@/lib/dal";
import { getTrustStats, listPublicReviews, type PublicReview, type TrustStats } from "@/lib/reviews";
import { getLegacyCustomerReviewStats, listLegacyCustomerReviews } from "@/lib/legacy-reviews";
import { getMonthlyVisits, looksAutomated, recordVisit } from "@/lib/visits";
import { featuredFaqsFor } from "@/components/faq-content";
import { Hero } from "@/components/landing/hero";
import { TrustBanner } from "@/components/landing/trust-banner";
import { NetworkRecord } from "@/components/landing/network-record";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PublisherWarning } from "@/components/publisher-warning";
import { Testimonials } from "@/components/landing/testimonials";
import { LandingFaq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";

/**
 * The landing page.
 *
 * Composition only. Every section is its own component under
 * components/landing, and all the copy lives in components/landing/content.ts
 * — this file's job is to fetch, count the visit, and lay the sections out in
 * order.
 *
 * All three lookups tolerate failure: this is the one page a brand-new install
 * with no database must still render, because it is where someone lands when
 * they are deciding whether the service is real.
 */
export default async function HomePage() {
  const user = await getCurrentUserQuietly();
  const locale = await getLocale();

  const [stats, reviews, legacyReviews, legacyStats] = await Promise.all([
    getTrustStats().catch(() => null),
    listPublicReviews(5).catch(() => []),
    listLegacyCustomerReviews(5).catch(() => []),
    getLegacyCustomerReviewStats().catch(() => ({ count: 0, ratingSum: 0 })),
  ]);

  const publicReviews = interleavePublicReviews(reviews, legacyReviews).slice(0, 9);
  const displayStats = mergeTrustStats(stats, legacyStats);

  // Counted here rather than in the proxy so it is one write per homepage
  // render, not one per asset. Signed-in people are skipped: the admin
  // refreshing their own site should not read as demand for it.
  const userAgent = (await headers()).get("user-agent");

  if (!user && !looksAutomated(userAgent)) {
    await recordVisit();
  }

  const monthlyVisits = (await getMonthlyVisits()) ?? 0;

  const signedIn = user !== null;
  const dashboardHref = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="space-y-24 sm:space-y-32">
      <Hero signedIn={signedIn} dashboardHref={dashboardHref} locale={locale} />

      <TrustBanner locale={locale} />

      {/* Before the site's own numbers, deliberately. The network's record is
          the larger and older claim, and seeing it first is what stops the
          smaller platform figures below reading as the whole story. */}
      <NetworkRecord locale={locale} />

      <Stats stats={displayStats} monthlyVisits={monthlyVisits} locale={locale} />

      <Features locale={locale} />

      <HowItWorks locale={locale} />

      {/* Directly under the how-it-works summary, not in the footer.
          Somebody who has just read how the escrow protects them is exactly
          who needs to be told what it does not cover, and it is worth more
          here — where it reads as candour — than buried in the FAQ where only
          careful readers find it. */}
      <div className="mx-auto max-w-3xl px-4">
        <PublisherWarning locale={locale} />
      </div>

      <Testimonials reviews={publicReviews} locale={locale} />

      <LandingFaq items={featuredFaqsFor(locale)} locale={locale} />

      <FinalCta
        locale={locale}
        primaryHref={signedIn ? "/deals/new" : "/register"}
        primaryLabel={
          locale === "ar"
            ? signedIn
              ? "افتح مبادلة"
              : "ابدأ مبادلة"
            : signedIn
              ? "Open a swap"
              : "Start a swap"
        }
        feeLine={feeLine(locale)}
      />
    </div>
  );
}

/**
 * The line under the closing call to action.
 *
 * It used to quote the configured commission. There is no commission: a swap
 * trades one account for another, so there is no amount to take a percentage
 * of. What replaced it as the thing worth saying last is that joining needs a
 * promoter's code — better learned here than at the sign-up form.
 */
function feeLine(locale: Locale): string {
  return locale === "ar"
    ? "لا رسوم ولا مال — حساب مقابل حساب. تحتاج إلى رمز داعٍ للانضمام."
    : "No fee, no money — one account for another. You need a promoter's code to join.";
}

function mergeTrustStats(stats: TrustStats | null, legacy: { count: number; ratingSum: number }): TrustStats | null {
  if (!stats || legacy.count === 0) return stats;

  const realCount = stats.reviews;
  const totalCount = realCount + legacy.count;
  const realRatingSum = (stats.averageRating ?? 0) * realCount;

  return {
    ...stats,
    reviews: totalCount,
    averageRating: totalCount > 0 ? (realRatingSum + legacy.ratingSum) / totalCount : null,
  };
}

function interleavePublicReviews(
  real: PublicReview[],
  legacy: Awaited<ReturnType<typeof listLegacyCustomerReviews>>,
): PublicReview[] {
  const imported = legacy.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date(0),
    authorName: review.authorName,
    subjectName: "",
    subjectId: "",
    subjectSide: "customer",
  }));

  const result: PublicReview[] = [];
  const length = Math.max(real.length, imported.length);
  for (let i = 0; i < length; i++) {
    if (real[i]) result.push(real[i]);
    if (imported[i]) result.push(imported[i]);
  }
  return result;
}
