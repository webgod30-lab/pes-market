import { headers } from "next/headers";
import { getLocale } from "@/lib/locale-server";
import type { Locale } from "@/lib/locale";

import { getCurrentUserQuietly } from "@/lib/dal";
import { defaultFeeBps, formatFeeBps } from "@/lib/fees";
import { getTrustStats, listPublicReviews } from "@/lib/reviews";
import { getMonthlyVisits, looksAutomated, recordVisit } from "@/lib/visits";
import { featuredFaqsFor } from "@/components/faq-content";
import { Hero } from "@/components/landing/hero";
import { TrustBanner } from "@/components/landing/trust-banner";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
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
  const feeBps = defaultFeeBps();
  const locale = await getLocale();

  const [stats, reviews] = await Promise.all([
    getTrustStats().catch(() => null),
    listPublicReviews(9).catch(() => []),
  ]);

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

      <Stats stats={stats} monthlyVisits={monthlyVisits} locale={locale} />

      <Features locale={locale} />

      <HowItWorks locale={locale} />

      <Testimonials reviews={reviews} locale={locale} />

      <LandingFaq items={featuredFaqsFor(locale)} locale={locale} />

      <FinalCta
        locale={locale}
        primaryHref={signedIn ? "/deals/new" : "/register"}
        primaryLabel={
          locale === "ar"
            ? signedIn
              ? "افتح صفقة"
              : "ابدأ صفقة"
            : signedIn
              ? "Open a deal"
              : "Start a deal"
        }
        feeLine={feeLine(locale, feeBps)}
      />
    </div>
  );
}

/**
 * The fee sentence under the closing call to action.
 *
 * Not in content.ts because it interpolates the configured rate, which is read
 * from the environment at request time rather than being copy.
 */
function feeLine(locale: Locale, feeBps: number): string {
  if (feeBps <= 0) {
    return locale === "ar"
      ? "لا توجد رسوم حاليًا — يستلم البائع بالضبط ما دفعه المشتري."
      : "No fee at the moment — the seller receives exactly what the buyer paid.";
  }

  return locale === "ar"
    ? `${formatFeeBps(feeBps)} من قيمة الصفقة، تُخصم من مستحقات البائع. ويدفع المشتري السعر المتفق عليه بالضبط.`
    : `${formatFeeBps(feeBps)} of the deal, taken from the seller's payout. The buyer pays exactly the agreed price.`;
}
