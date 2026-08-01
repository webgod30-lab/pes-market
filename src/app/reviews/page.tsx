import Link from "next/link";

import { getTrustStats, listPublicReviews } from "@/lib/reviews";
import { Stars } from "@/components/reputation";
import { Card, EmptyState, PageHeading } from "@/components/ui";

/**
 * Rendered per request, not prerendered at build.
 *
 * This page reads the database but uses no dynamic API, so Next would otherwise
 * try to bake it at build time — which fails the whole deploy if the database
 * happens to be asleep (Neon scales to zero). Reviews should be current anyway.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews — PES Escrow",
  description:
    "What people say after trading through PES Escrow. Every review comes from a completed deal — both the buyer and the seller rate each other.",
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Average rating</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">
            {stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Deals completed</p>
          <p className="mt-2 text-2xl font-semibold">{stats.completedDeals}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Settled without a dispute</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.cleanRate === null ? "—" : `${Math.round(stats.cleanRate * 100)}%`}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Reviews</p>
          <p className="mt-2 text-2xl font-semibold">{stats.reviews}</p>
        </Card>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">
        These numbers are counted from real deals on this service, including the ones that went
        wrong. A dispute counts against the clean rate whichever way it was decided.
      </p>

      <h2 className="mt-10 mb-3 text-sm font-semibold">Recent reviews</h2>

      {reviews.length === 0 ? (
        <EmptyState>
          <p className="font-medium text-[var(--foreground)]">No reviews yet.</p>
          <p className="mt-1">They appear here once deals start completing.</p>
        </EmptyState>
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
                    className="text-emerald-400 hover:underline"
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
