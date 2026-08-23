"use client";

import Link from "next/link";
import { useState } from "react";

import type { ReviewsPageEntry } from "@/lib/reviews";
import { REVIEWS_PAGE } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";
import { Stars } from "@/components/reputation";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { Card } from "@/components/ui";

/** The filter toggle and the review grid — split out from the page because
 * only this part needs client-side state. */
export function ReviewsFilter({ reviews, locale }: { reviews: ReviewsPageEntry[]; locale: Locale }) {
  const copy = REVIEWS_PAGE[locale];
  const [filter, setFilter] = useState<"all" | "buyer" | "seller">("all");

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.authorId && r.authorRole === filter);

  return (
    <>
      <div className="mt-8 flex items-center gap-2">
        {(["all", "buyer", "seller"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-3)]"
            }`}
          >
            {f === "all" ? copy.filterAll : f === "buyer" ? copy.filterBuyer : copy.filterSeller}
          </button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="mt-6">
          <EmptyPanel icon="star" title={copy.emptyTitle}>
            {copy.emptyBody}
          </EmptyPanel>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyPanel icon="star" title={copy.emptyFilteredTitle(filter as "buyer" | "seller")}>
            {copy.emptyFilteredBody(filter as "buyer" | "seller")}
          </EmptyPanel>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filtered.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {review.authorId ? (
                    <Link
                      href={`/u/${review.authorId}`}
                      className="truncate font-medium text-[var(--accent)] hover:underline"
                    >
                      {review.authorName}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-[var(--accent)]">{review.authorName}</span>
                  )}
                  <p className="text-xs text-[var(--muted)]">
                    {review.authorId
                      ? `${review.authorRole === "buyer" ? copy.buyerLabel : copy.sellerLabel} · ${review.dealReference}`
                      : "Customer review"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Stars rating={review.rating} />
                  <span className="text-sm font-medium tabular-nums">{review.rating}</span>
                </div>
              </div>

              {review.comment ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">{review.comment}</p>
              ) : null}

              {review.authorId ? (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {review.createdAt.toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
