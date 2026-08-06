import { cn } from "@/components/ui";

/**
 * One proportion, as a bar with the number beside it.
 *
 * `Breakdown` answers "how does this whole split up". This answers a different
 * question — "how much of X is Y" — and a stacked bar is the wrong shape for
 * that: a single filled track against an empty one reads as a proportion, where
 * two segments read as two categories.
 *
 * Used for the rates on the admin console, all of which are one number out of
 * another number the page has already counted.
 */
export function RatioBar({
  label,
  value,
  of,
  caption,
  invert = false,
}: {
  label: string;
  value: number;
  of: number;
  caption?: string;
  /** True when a *high* number is the bad one — the dispute rate, say. */
  invert?: boolean;
}) {
  // Nothing to be a proportion of. Showing 0% would imply a measurement that
  // was never taken.
  if (of <= 0) {
    return (
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-[var(--muted)]">{label}</span>
          <span className="text-xs text-[var(--muted)]">no data yet</span>
        </div>
        <div aria-hidden="true" className="mt-1.5 h-1.5 rounded-full bg-[var(--surface-2)]" />
      </div>
    );
  }

  const pct = (value / of) * 100;
  const rounded = Math.round(pct);

  // Thresholds are on the *good* reading of the number, so inverting the
  // meaning does not need a second set of them.
  const good = invert ? 100 - pct : pct;
  const tone =
    good >= 90
      ? "bg-[var(--accent)]"
      : good >= 70
        ? "bg-[var(--tone-warning)]"
        : "bg-[var(--tone-danger)]";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-[var(--muted)]">{label}</span>
        <span className="text-xs font-semibold tabular-nums">
          {rounded}%
          <span className="ml-1.5 font-normal text-[var(--muted)]">
            ({value} of {of})
          </span>
        </span>
      </div>

      <div
        role="meter"
        aria-label={label}
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]"
      >
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>

      {caption ? <p className="mt-1 text-xs text-[var(--faint)]">{caption}</p> : null}
    </div>
  );
}
