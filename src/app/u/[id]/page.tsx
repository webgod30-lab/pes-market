import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicProfile } from "@/lib/reviews";
import { ReputationLine, Stars } from "@/components/reputation";
import { Card, EmptyState, PageHeading } from "@/components/ui";

/** Per request, not prerendered — see the note in /reviews. */
export const dynamic = "force-dynamic";

/**
 * A public record for one trader.
 *
 * Everything here is already public on the reviews wall. No email, no deal
 * details, no amounts — someone deciding whether to trade with this person needs
 * their track record, not their transaction history.
 */
export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  if (!profile) notFound();

  const { reputation } = profile;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        title={profile.displayName}
        description={`Trading here since ${profile.joinedAt.toLocaleDateString("en-GB")}.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Overall</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--tone-warning)]">
            {reputation.average ? `${reputation.average.toFixed(1)} ★` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {reputation.count} review{reputation.count === 1 ? "" : "s"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">As a seller</p>
          <p className="mt-2 text-2xl font-semibold">
            {reputation.asSeller.average ? `${reputation.asSeller.average.toFixed(1)} ★` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {reputation.completedSales} sale{reputation.completedSales === 1 ? "" : "s"} completed
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">As a buyer</p>
          <p className="mt-2 text-2xl font-semibold">
            {reputation.asBuyer.average ? `${reputation.asBuyer.average.toFixed(1)} ★` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {reputation.completedPurchases} purchase
            {reputation.completedPurchases === 1 ? "" : "s"} completed
          </p>
        </Card>
      </div>

      <div className="mt-3">
        <ReputationLine reputation={reputation} />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Reviews</h2>

      {profile.reviews.length === 0 ? (
        <EmptyState>
          Nobody has reviewed {profile.displayName} yet. That is not a bad sign on its own — it just
          means there is no record to go on.
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {profile.reviews.map((review) => (
            <li key={review.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-[var(--muted)]">
                    as {review.subjectSide} · {review.createdAt.toLocaleDateString("en-GB")}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm leading-relaxed">{review.comment}</p>
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
        <Link href="/reviews" className="text-[var(--accent)] hover:underline">
          All reviews
        </Link>
      </p>
    </div>
  );
}
