import Link from "next/link";

import { getTrustStats, listPublicReviews } from "@/lib/reviews";
import { Stars } from "@/components/reputation";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Card, PageHeading } from "@/components/ui";

/**
 * Rendered per request, not prerendered at build.
 *
 * This page reads the database but uses no dynamic API, so Next would otherwise
 * try to bake it at build time — which fails the whole deploy if the database
 * happens to be asleep (Neon scales to zero). Reviews should be current anyway.
 */
export const dynamic = "force-dynamic";

/**
 * Below this many reviews, the page says outright that the service is new.
 *
 * Twenty is roughly where a wall stops looking thin: ten hand-refereed swaps
 * produce two reviews each, which is the point the record starts speaking for
 * itself and the banner stops being the most useful thing on the page.
 */
const NEW_SERVICE_THRESHOLD = 20;

export const metadata = {
  title: "Reviews",
  description:
    "What people say after trading through PESescrow.com. Every review comes from a completed deal — both the buyer and the seller rate each other.",
};

/**
 * The public trust page.
 *
 * Shows names, ratings and comments — and nothing else. No deal references, no
 * account descriptions, no amounts: a public feed of who bought what for how
 * much would be a gift to anyone targeting these people.
 */
export default async function ReviewsPage() {
  const [stats, reviews] = await Promise.all([getTrustStats(), listPublicReviews(50)]);

  return (
    <div>
      <PageHeading
        title="What traders say"
        description="Every review here comes from a deal that actually completed through escrow. Both sides rate each other, so the record cuts both ways."
      />

      {/* Said before the numbers, not after.

          A service nobody has heard of showing a handful of reviews invites the
          question "is this real?". Answering it first — with the actual count,
          however small — is worth more than the reviews are. Traders respect a
          small honest number and are suspicious of a large one from a site with
          no history; and the people this is sold to are expert at spotting
          things that do not add up, because that skill is how they avoid being
          scammed. Disappears on its own once there are enough to speak for
          themselves. */}
      {reviews.length < NEW_SERVICE_THRESHOLD ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--tone-info-border)] bg-[var(--tone-info-bg)] p-4">
          <p className="text-overline uppercase text-[var(--tone-info)]">We are new</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
            {reviews.length === 0 ? (
              <>
                Nobody has completed a swap here yet, so this page is empty. It will stay empty
                until somebody does — we would rather show you nothing than show you something we
                made up.
              </>
            ) : (
              <>
                This is every review we have — all {reviews.length} of them, from{" "}
                {stats.completedDeals} completed{" "}
                {stats.completedDeals === 1 ? "swap" : "swaps"}. Nothing here is written by us or
                by anyone we invented.
              </>
            )}
          </p>
        </div>
      ) : null}

      <StatGrid columns={4}>
        <StatCard
          label="Average rating"
          value={stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : "—"}
          caption="across both sides of every deal"
          icon="star"
        />
        <StatCard
          label="Deals completed"
          value={stats.completedDeals}
          caption="settled through escrow"
          icon="folder"
        />
        <StatCard
          label="Settled without a dispute"
          value={stats.cleanRate === null ? "—" : `${Math.round(stats.cleanRate * 100)}%`}
          caption="a dispute counts against this either way"
          icon="scales"
        />
        <StatCard
          label="Reviews"
          value={stats.reviews}
          caption="one per person, per deal"
          icon="mail"
        />
      </StatGrid>

      <p className="mt-3 text-xs text-[var(--muted)]">
        These numbers are counted from real deals on this service, including the ones that went
        wrong. A dispute counts against the clean rate whichever way it was decided.
      </p>

      <h2 className="mt-10 mb-3 text-sm font-semibold">Recent reviews</h2>

      {reviews.length === 0 ? (
        <EmptyPanel icon="star" title="No reviews yet">
          They appear here once deals start completing. Both sides review each other, so a buyer who
          never pays is as visible as a seller who hands over a dead account.
        </EmptyPanel>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id}>
              <Card className="h-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-[var(--muted)]">
                    {review.createdAt.toLocaleDateString("en-GB")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{review.comment}</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {review.authorName} on{" "}
                  <Link
                    href={`/u/${review.subjectId}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {review.subjectName}
                  </Link>{" "}
                  as {review.subjectSide}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
