import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicProfile } from "@/lib/reviews";
import { ReputationLine, Stars } from "@/components/reputation";
import { Avatar } from "@/components/nav/identity";
import { Breakdown, type Segment } from "@/components/dashboard/breakdown";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui";

/** Per request, not prerendered — see the note in /reviews. */
export const dynamic = "force-dynamic";

/**
 * A real title and description per profile.
 *
 * This was the only page in the app inheriting the site-wide default, so every
 * trader's profile shared one generic title in search results and in the
 * preview card when somebody pastes a link asking "is this person safe to trade
 * with" — which is exactly when the link gets shared.
 *
 * Nothing here is private: the name, the join date and the review count are all
 * already on the public reviews wall.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  if (!profile) return { title: "Trader not found" };

  const { count, average } = profile.reputation;

  return {
    title: `${profile.displayName} — trader record`,
    description:
      count > 0
        ? `${profile.displayName} has ${count} review${count === 1 ? "" : "s"} on PESescrow.com${
            average ? `, averaging ${average.toFixed(1)} out of 5` : ""
          }. Both sides review each other after every completed deal.`
        : `${profile.displayName} has no reviews on PESescrow.com yet. Both sides review each other after every completed deal.`,
  };
}

/**
 * A public record for one trader.
 *
 * Everything here is already public on the reviews wall. No email, no deal
 * details, no amounts — someone deciding whether to trade with this person needs
 * their track record, not their transaction history.
 *
 * The rating spread is the addition worth explaining. An average of 4.6 says
 * very little on its own: it is the same number whether every review was a 4 or
 * a 5, or whether nine were 5s and one was a 1. On a service whose whole point
 * is deciding whether to trust a stranger, the shape of the reviews matters more
 * than their mean — and it is derived from the reviews already on the page.
 */
export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  if (!profile) notFound();

  const { reputation } = profile;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={profile.displayName} size="lg" />

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{profile.displayName}</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Trading here since{" "}
            <time dateTime={profile.joinedAt.toISOString()}>
              {profile.joinedAt.toLocaleDateString("en-GB")}
            </time>
          </p>
          <div className="mt-1.5">
            <ReputationLine reputation={reputation} />
          </div>
        </div>
      </header>

      <StatGrid columns={3}>
        <StatCard
          label="Overall"
          value={reputation.average ? `${reputation.average.toFixed(1)} ★` : "—"}
          caption={`${reputation.count} review${reputation.count === 1 ? "" : "s"}`}
          icon="star"
        />
        <StatCard
          label="As a seller"
          value={reputation.asSeller.average ? `${reputation.asSeller.average.toFixed(1)} ★` : "—"}
          caption={`${reputation.completedSales} sale${
            reputation.completedSales === 1 ? "" : "s"
          } completed`}
          icon="payout"
        />
        <StatCard
          label="As a buyer"
          value={reputation.asBuyer.average ? `${reputation.asBuyer.average.toFixed(1)} ★` : "—"}
          caption={`${reputation.completedPurchases} purchase${
            reputation.completedPurchases === 1 ? "" : "s"
          } completed`}
          icon="wallet"
        />
      </StatGrid>

      {profile.reviews.length > 0 ? (
        <div className="mt-3">
          <Breakdown
            title="How the ratings fall"
            caption="An average hides whether the low ones are rare or routine."
            segments={ratingSpread(profile.reviews)}
          />
        </div>
      ) : null}

      <h2 className="mb-3 mt-8 text-sm font-semibold">Reviews</h2>

      {profile.reviews.length === 0 ? (
        <EmptyPanel icon="star" title={`No reviews for ${profile.displayName} yet`}>
          That is not a bad sign on its own — it just means there is no record to go on. Both sides
          review each other after every completed deal, so this fills up once they trade.
        </EmptyPanel>
      ) : (
        <ul className="space-y-2">
          {profile.reviews.map((review) => (
            <li key={review.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-[var(--muted)]">
                    as {review.subjectSide} ·{" "}
                    <time dateTime={review.createdAt.toISOString()}>
                      {review.createdAt.toLocaleDateString("en-GB")}
                    </time>
                  </span>
                </div>

                {review.comment ? (
                  <blockquote className="mt-2 text-sm leading-relaxed">{review.comment}</blockquote>
                ) : (
                  <p className="mt-2 text-sm italic text-[var(--muted)]">No comment left.</p>
                )}

                <p className="mt-2 text-xs text-[var(--muted)]">by {review.authorName}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        {/* inline-flex + min-h-9: as bare inline text this was a 16px target,
            under the minimum and the only interactive thing at the foot of the
            page. Same convention as the footer and the landing sections. */}
        <Link
          href="/reviews"
          className="inline-flex min-h-9 items-center text-[var(--accent)] hover:underline"
        >
          All reviews across the service
        </Link>
      </p>
    </div>
  );
}

/** Five buckets, best first, from the reviews already fetched. */
function ratingSpread(reviews: { rating: number }[]): Segment[] {
  return [5, 4, 3, 2, 1].map((rating) => ({
    label: `${rating} star${rating === 1 ? "" : "s"}`,
    value: reviews.filter((review) => review.rating === rating).length,
    // Anything at three or below is what a reader is scanning for, so it is not
    // drawn in the same colour as a good review.
    tone: (rating >= 4 ? "success" : rating === 3 ? "warning" : "danger") as Segment["tone"],
  }));
}
