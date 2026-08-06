"use client";

import { Marquee } from "@/components/landing/motion";
import { TRUST_POINTS } from "@/components/landing/content";

/**
 * The scrolling strip under the hero.
 *
 * This is where a landing page normally puts a row of grey customer logos.
 * There are none to put — so it scrolls the actual guarantees instead, which
 * has the advantage of being true and of saying something a visitor can check.
 *
 * Masked at both edges so items fade in and out rather than being clipped
 * mid-word against a hard boundary.
 */
export function TrustBanner() {
  return (
    <section
      aria-label="What this service guarantees"
      className="relative border-y border-[var(--border)] bg-[var(--surface)]/40 py-4"
    >
      <div
        className="[mask-image:linear-gradient(to_right,transparent,#000_9%,#000_91%,transparent)]"
      >
        <Marquee speed={44}>
          {TRUST_POINTS.map((point) => (
            <span
              key={point}
              className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-sm text-[var(--muted)]"
            >
              <svg
                viewBox="0 0 16 16"
                className="size-3.5 shrink-0 text-[var(--accent)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {point}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
