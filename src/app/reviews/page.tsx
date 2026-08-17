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
 * Reviews are dated to the month, not the day.
 *
 * Eleven reviews sharing one timestamp reads as a batch import even when the
 * deals behind them were real, and that is the single most damaging thing a
 * date field can do on a page whose entire job is looking like a ledger.
 *
 * Rounded rather than removed, though. For most products a review date is
 * decoration; for an escrow service it is load-bearing, because it answers the
 * question nobody asks out loud — "is anyone still here?" — and stripping it
 * would trade an obvious problem for a subtler one. The month keeps the
 * freshness signal and loses the tell, and the summary line above carries the
 * precise recency the individual dates no longer do.
 *
 * DISPLAY ONLY. The full timestamp stays in the database, because disputes,
 * fraud checks and sorting all need it and it cannot be reconstructed later.
 */
function monthOf(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** "3 days ago", for the one place precise recency still earns its keep. */
function agoFrom(date: Date, now: Date): string {
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);

  return months === 1 ? "a month ago" : `${months} months ago`;
}

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

      <h2 className="mt-10 mb-1 text-sm font-semibold">Recent reviews</h2>

      {/* The pulse line.
          Individual reviews only carry a month now, so precise recency lives
          here instead — and it is the more useful place for it, because "most
          recent 3 days ago" answers "is anyone still here" for the whole page
          rather than for one card. Newest first, always, since order is the
          only other recency cue left. */}
      {stats.lastCompletedAt ? (
        <p className="mb-3 text-xs text-[var(--muted)]">
          {stats.completedDeals} swap{stats.completedDeals === 1 ? "" : "s"} completed · most recent{" "}
          {agoFrom(stats.lastCompletedAt, new Date())}
          {stats.averageRating ? ` · average rating ${stats.averageRating.toFixed(1)}` : ""} ·
          newest first
        </p>
      ) : (
        <p className="mb-3 text-xs text-[var(--muted)]">Newest first.</p>
      )}

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
                  <span className="text-xs text-[var(--muted)]">{monthOf(review.createdAt)}</span>
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
