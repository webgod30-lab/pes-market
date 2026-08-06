import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/components/ui/tone";
import { Spinner } from "@/components/ui/feedback";

/**
 * Buttons.
 *
 * `size` exists because the codebase had already grown one by hand: eight
 * call sites passed className="px-3 py-2 text-xs" to shrink a button, which is
 * a size variant written out longhand and slightly differently each time.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS = {
  primary: "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--border)]",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
  // No fill and no border: for the third action in a row, where two solid
  // buttons and a link would be one button too many.
  ghost: "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
} as const;

const SIZES = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

type Shared = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretches to the container — common inside the mobile sheet. */
  block?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ComponentProps<"button"> &
  Shared & {
    /**
     * Shows a spinner and blocks further clicks.
     *
     * Every form in this app already swaps its label while a server action is
     * in flight ("Saving…"), which says something is happening but not that it
     * is still happening. The spinner keeps moving; a changed label does not.
     */
    loading?: boolean;
  }) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-3.5" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  ...props
}: ComponentProps<typeof Link> & Shared) {
  return (
    <Link
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className)}
      {...props}
    />
  );
}

/**
 * A button that looks like a link. For destructive-but-minor actions that
 * should not compete with the real buttons around them — "Cancel this
 * request", "Turn off two-factor".
 */
export function LinkButton({
  tone = "danger",
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { tone?: "danger" | "muted"; children: ReactNode }) {
  return (
    <button
      className={cn(
        "text-xs hover:underline disabled:cursor-not-allowed disabled:opacity-60",
        tone === "danger" ? "text-[var(--tone-danger)]" : "text-[var(--muted)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
