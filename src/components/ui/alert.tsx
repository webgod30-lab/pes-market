import type { ReactNode } from "react";

import { cn, TONE_SURFACE, type Tone } from "@/components/ui/tone";

/**
 * A tinted callout.
 *
 * This is the most-repeated shape in the app: a bordered, tinted box saying
 * something the reader needs to act on. It was written by hand in eighteen
 * files, with eleven different border/background opacity pairs for what are
 * really four states — so a warning on the deal page did not match a warning
 * on the wallet page.
 *
 * `role="alert"` only when `live` is set. A screen reader interrupting itself
 * for a paragraph that was already on the page when it loaded is noise; the
 * interruption is right for a validation error that just appeared.
 */
export function Alert({
  tone = "info",
  title,
  children,
  live = false,
  className = "",
}: {
  tone?: Tone;
  /** Bolded lead-in. The rest reads as the explanation. */
  title?: ReactNode;
  children?: ReactNode;
  /** Set for something that appeared in response to an action. */
  live?: boolean;
  className?: string;
}) {
  return (
    <div
      role={live ? "alert" : undefined}
      className={cn(
        "rounded-[var(--radius-control)] border px-3 py-2.5 text-sm leading-relaxed",
        TONE_SURFACE[tone],
        className,
      )}
    >
      {title ? <strong className="font-semibold">{title}</strong> : null}
      {title && children ? " " : null}
      {children}
    </div>
  );
}

/**
 * The error banner at the top of a form.
 *
 * Renders nothing without a message, so callers can pass a possibly-undefined
 * value straight from form state without guarding it themselves.
 */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Alert tone="danger" live>
      {message}
    </Alert>
  );
}
