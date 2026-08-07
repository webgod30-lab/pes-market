import type { ReactNode } from "react";

import { cn } from "@/components/ui/tone";

/** The heading block at the top of a page. */
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

/**
 * A single headline figure.
 *
 * Lifted out of the landing page, where it was defined locally, so the trust
 * band, the admin console and the wallet can show a number the same way
 * instead of three near-identical blocks.
 */
export function Stat({
  value,
  label,
  tone = "default",
  align = "center",
}: {
  value: string;
  label: string;
  /** `accent` for the one figure that should catch the eye. */
  tone?: "default" | "accent" | "warning";
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5",
        align === "center" ? "text-center" : "text-start",
      )}
    >
      <p
        className={cn(
          "text-3xl font-semibold tracking-tight tabular-nums",
          tone === "accent" && "text-[var(--tone-warning)]",
          tone === "warning" && "text-[var(--tone-warning)]",
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}

export type DetailRow = {
  label: string;
  value: ReactNode;
  /** For anything read character by character or copied — an IBAN, a hash. */
  mono?: boolean;
};

/**
 * Labelled rows in a bordered list.
 *
 * The wallet and the admin withdrawals page were rendering the same payout
 * destination with the same markup written twice. When the seller checking
 * their request and the admin sending the money see different labels for the
 * same value, money goes to the wrong place — so the markup lives in one
 * place, as the data helper behind it already does.
 */
export function DetailList({
  rows,
  labelWidth = "w-44",
  className = "",
}: {
  rows: DetailRow[];
  labelWidth?: string;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)]",
        className,
      )}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-[var(--surface-2)] px-3 py-2"
        >
          <dt className={cn("shrink-0 text-xs text-[var(--muted)]", labelWidth)}>{row.label}</dt>
          <dd className={cn("min-w-0 flex-1 break-all text-sm", row.mono && "font-mono")}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A small-caps label above a value or a group.
 *
 * Written inline as `text-xs uppercase tracking-wide text-[var(--muted)]` in
 * a dozen places, occasionally with a different size or tracking.
 */
export function Overline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-overline uppercase text-[var(--muted)]", className)}>{children}</p>
  );
}
