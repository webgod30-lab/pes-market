"use client";

import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { SECTIONS } from "@/components/landing/content";

import { Reveal, RevealGroup, RevealItem } from "@/components/landing/motion";
import { Stars } from "@/components/reputation";
import type { PublicReview } from "@/lib/reviews";

/**
 * What customers said after trading.
 *
 * Current reviews come from completed deals. The historical customer-review
 * archive is stored separately because its source contains no user/deal IDs;
 * inventing those relationships would corrupt the verified reputation model.
 */
export function Testimonials({ reviews, locale }: { reviews: PublicReview[]; locale: Locale }) {
  const copy = SECTIONS[locale];
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="testimonials-heading">
      <Reveal className="mb-10 text-center">
        <h2
          id="testimonials-heading"
          className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {copy.reviewsTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-[var(--muted)]">
          {copy.reviewsBody}
        </p>
      </Reveal>

      {/* Columns rather than a grid: quotes are different lengths, and a grid
          would pad them all to the tallest, leaving holes. */}
      <RevealGroup className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {reviews.map((review) => (
          <RevealItem key={review.id} className="mb-3 break-inside-avoid">
            <figure className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]/40">
              <Stars rating={review.rating} />

              <blockquote className="mt-3 text-sm leading-relaxed">{review.comment}</blockquote>

              <figcaption className="mt-4 flex items-center gap-2.5 border-t border-[var(--border)] pt-3">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--tone-success-bg)] text-xs font-semibold text-[var(--accent)]"
                >
                  {review.authorName.trim().charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 text-xs">
                  <span className="font-medium">{review.authorName}</span>
                  <span className="text-[var(--muted)]">
                    {review.subjectSide === "customer"
                      ? " · Customer review"
                      : ` · on ${review.subjectName} as ${review.subjectSide === "seller" ? "seller" : "buyer"}`}
                  </span>
                </span>
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal className="mt-8 text-center">
        {/* inline-flex + min-h-9: a 19px inline link is under the minimum tap
            target. Same reason as the footer links. */}
        <Link
          href="/reviews"
          className="inline-flex min-h-9 items-center text-sm text-[var(--accent)] hover:underline"
        >
          {copy.reviewsMore}
        </Link>
      </Reveal>
    </section>
  );
}
