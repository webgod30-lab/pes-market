import { cn } from "@/components/ui";
import type { Tone } from "@/components/ui";

/**
 * Where things currently stand, as one proportional bar.
 *
 * Built only from rows the page has already fetched — no extra query, no stored
 * history. That constraint is why this is a distribution rather than a trend
 * line: this service records no time series, and a chart with a made-up x-axis
 * on an escrow console would be worse than no chart.
 *
 * What it is actually for: a stack of counts tells you the numbers, and this
 * tells you the shape. Six deals waiting on payment out of eight is a different
 * afternoon from six out of sixty, and the numbers alone do not say which.
 */
export type Segment = {
  label: string;
  value: number;
  tone: Tone;
  href?: string;
};

const TONE_BAR: Record<Tone, string> = {
  neutral: "bg-[var(--tone-neutral)]",
  info: "bg-[var(--tone-info)]",
  success: "bg-[var(--accent)]",
  warning: "bg-[var(--tone-warning)]",
  danger: "bg-[var(--tone-danger)]",
};

const TONE_DOT: Record<Tone, string> = TONE_BAR;

export function Breakdown({
  title,
  caption,
  segments,
  emptyLabel = "Nothing to show yet.",
}: {
  title: string;
  caption?: string;
  segments: Segment[];
  emptyLabel?: string;
}) {
  const shown = segments.filter((segment) => segment.value > 0);
  const total = shown.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <section
      aria-labelledby="breakdown-heading"
      className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="breakdown-heading" className="text-sm font-semibold">
          {title}
        </h2>
        {total > 0 ? (
          <span className="text-xs tabular-nums text-[var(--muted)]">{total} total</span>
        ) : null}
      </div>

      {caption ? <p className="mt-1 text-xs text-[var(--muted)]">{caption}</p> : null}

      {total === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{emptyLabel}</p>
      ) : (
        <>
          {/* The bar is decoration over the list below, which carries the same
              information as text — so it is hidden rather than described. */}
          <div
            aria-hidden="true"
            className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-[var(--surface-2)]"
          >
            {shown.map((segment) => (
              <span
                key={segment.label}
                className={cn("h-full first:rounded-l-full last:rounded-r-full", TONE_BAR[segment.tone])}
                style={{ width: `${(segment.value / total) * 100}%` }}
              />
            ))}
          </div>

          <ul className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {shown.map((segment) => (
              <li key={segment.label} className="flex items-center gap-2 text-xs">
                <span
                  aria-hidden="true"
                  className={cn("size-2 shrink-0 rounded-full", TONE_DOT[segment.tone])}
                />
                <span className="min-w-0 flex-1 truncate text-[var(--muted)]">{segment.label}</span>
                <span className="shrink-0 font-medium tabular-nums">{segment.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
