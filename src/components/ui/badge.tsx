import type { ReactNode } from "react";

import { cn, TONE_SURFACE, type Tone } from "@/components/ui/tone";

const SIZES = {
  sm: "px-2 py-0.5 text-[0.6875rem]",
  md: "px-2.5 py-0.5 text-xs",
} as const;

/** Status pill: deal states, which side you hold, the admin marker. */
export function Badge({
  children,
  tone = "neutral",
  size = "md",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] border font-medium",
        TONE_SURFACE[tone],
        SIZES[size],
      )}
    >
      {children}
    </span>
  );
}

/**
 * A badge with a live dot, for a state that is currently true rather than
 * merely recorded — "waiting on you", not "refunded".
 */
export function PulseBadge({
  children,
  tone = "success",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-medium",
        TONE_SURFACE[tone],
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
      {children}
    </span>
  );
}
