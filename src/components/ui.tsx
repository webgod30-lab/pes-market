// Small presentational building blocks, so pages stay readable and every
// screen looks like it belongs to the same app.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description ? <p className="mt-2 text-sm text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_VARIANTS = {
  primary: "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--border)]",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
} as const;

type Variant = keyof typeof BUTTON_VARIANTS;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...props} />;
}

/** Coloured status pill: deal states, which side you hold, admin badge. */
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

// The tints and borders are alpha, so they sit correctly over either
// background unchanged. Only the text has to change: a -300 shade is legible
// on the dark surfaces and far too pale on white, so it comes from a variable
// that each palette sets for itself.
const TONES = {
  neutral: "border-slate-500/30 bg-slate-500/10 text-[var(--tone-neutral)]",
  success: "border-emerald-500/30 bg-emerald-500/10 text-[var(--tone-success)]",
  warning: "border-amber-500/40 bg-amber-500/10 text-[var(--tone-warning)]",
  danger: "border-red-500/30 bg-red-500/10 text-[var(--tone-danger)]",
  info: "border-sky-500/30 bg-sky-500/10 text-[var(--tone-info)]",
} as const;

export type Tone = keyof typeof TONES;

/** Form field wrapper: label, input, and its error message. */
export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p> : null}
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-[var(--tone-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClassName =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]";

/** Top-of-form error banner. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-[var(--tone-danger)]"
    >
      {message}
    </div>
  );
}

/**
 * Rendered server-side when the app cannot reach or read the database. Names the
 * problem and the exact command that fixes it, instead of a blank error page.
 */
export function SetupProblem({ title, fix }: { title: string; fix: string }) {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{fix}</p>
        <p className="mt-4 text-xs text-[var(--muted)]">
          This is a setup problem, not a problem with your account. See the Setup section of the
          README.
        </p>
      </Card>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-10 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}
