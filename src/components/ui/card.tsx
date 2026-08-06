import type { ReactNode } from "react";

import { cn, TONE_BORDER, type Tone } from "@/components/ui/tone";

const PADDING = {
  none: "",
  tight: "p-[var(--spacing-card-tight)]",
  normal: "p-[var(--spacing-card)]",
} as const;

const ELEVATION = {
  /** Flat against the page. The default, and right for most stacked content. */
  flat: "",
  /** Lifted a little — for a card that is the subject of the screen. */
  raised: "shadow-[var(--shadow-e1)]",
  /** Floating, for anything overlaying the page. */
  floating: "shadow-[var(--shadow-e2)]",
} as const;

export type CardPadding = keyof typeof PADDING;
export type CardElevation = keyof typeof ELEVATION;

/**
 * The panel everything sits in.
 *
 * `padding` and `elevation` default to what every existing call site already
 * renders, so adding them changed nothing on screen.
 */
export function Card({
  children,
  className = "",
  padding = "normal",
  elevation = "flat",
  tone,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
  elevation?: CardElevation;
  /** Colours the edge — a disputed deal, a withdrawal needing attention. */
  tone?: Tone;
  /** Adds hover feedback. Only for cards that are wrapped in a link. */
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border bg-[var(--surface)]",
        tone ? TONE_BORDER[tone] : "border-[var(--border)]",
        PADDING[padding],
        ELEVATION[elevation],
        interactive && "transition-colors hover:border-[var(--accent)]/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A titled section inside a card, with the heading and its explanation set
 * consistently.
 *
 * Nearly every panel in the app opens with an h2 followed by a muted
 * paragraph, and the two were spaced slightly differently each time.
 */
export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  /** Right-aligned control — a filter, a link out, a badge. */
  action?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", description ? "mb-4" : "mb-3")}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
