"use client";

import { CountUp, RevealGroup, RevealItem } from "@/components/landing/motion";
import { headlineStats, USE_LIVE_STATS } from "@/components/landing/content";
import type { TrustStats } from "@/lib/reviews";

/**
 * The three headline figures.
 *
 * Which numbers appear is decided in content.ts, not here — see the note on
 * USE_LIVE_STATS there, which explains what the database actually reports and
 * why the difference matters. This component renders whichever it is handed.
 *
 * The live path counts up; the display path does not, because counting up to
 * a hand-written string is not possible and faking it would be theatre.
 */
export function Stats({
  stats,
  monthlyVisits,
}: {
  stats: TrustStats | null;
  monthlyVisits: number;
}) {
  const figures = headlineStats(stats, monthlyVisits);

  return (
    <section aria-label="By the numbers" className="relative">
      <RevealGroup className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        {figures.map((figure) => (
          <RevealItem
            key={figure.label}
            className="group relative bg-[var(--surface)] px-6 py-8 text-center transition-colors hover:bg-[var(--surface-2)]"
          >
            <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {USE_LIVE_STATS ? (
                <CountUp to={figure.value} format={figure.format} />
              ) : (
                figure.display
              )}
            </p>
            <p className="mt-2 text-sm font-medium">{figure.label}</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{figure.caption}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
