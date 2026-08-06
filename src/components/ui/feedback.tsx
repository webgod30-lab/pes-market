import type { ReactNode } from "react";

import { cn } from "@/components/ui/tone";

/**
 * Loading states.
 *
 * Three kinds, and which one to use is not a style choice:
 *
 *   Spinner   something is happening right now, in a known place — inside the
 *             button you just pressed.
 *   Skeleton  content is coming and its shape is known, so reserve the space.
 *             Prevents the layout jumping when it lands.
 *   Loading   a whole region is waiting and nothing sensible can be sketched.
 */

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A placeholder the size of the thing that is coming.
 *
 * `aria-hidden` on purpose: a screen reader announcing three grey rectangles
 * is worse than silence. Pair it with an aria-live region if the wait is long
 * enough to need narrating.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[var(--radius-control)] bg-[var(--surface-2)]", className)}
    />
  );
}

/** Centred spinner with a line of text, for a region with nothing to sketch. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2.5 px-6 py-10 text-sm text-[var(--muted)]"
    >
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

/** Nothing here yet — and that is the expected state, not a failure. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] px-6 py-10 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

/**
 * Rendered server-side when the app cannot reach or read the database. Names
 * the problem and the exact command that fixes it, instead of a blank error
 * page.
 */
export function SetupProblem({ title, fix }: { title: string; fix: string }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-h3">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{fix}</p>
        <p className="mt-4 text-xs text-[var(--muted)]">
          This is a setup problem, not a problem with your account. See the Setup section of the
          README.
        </p>
      </div>
    </div>
  );
}
