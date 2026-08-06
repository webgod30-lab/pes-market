import Link from "next/link";
import type { ReactNode } from "react";

import { NavIcon, type NavIconName } from "@/components/nav/nav-icons";
import { cn } from "@/components/ui";

/**
 * A number worth looking at.
 *
 * This shape was written out by hand five times — three on the trader
 * dashboard, two on the admin hub — each with its own padding, its own uppercase
 * label and its own rule for when to turn the figure amber. Same card, five
 * copies, already drifting.
 *
 * `urgent` is the interesting prop. A queue count means something different
 * from a total: nine open disputes is a problem, nine users is a Tuesday. Only
 * cards that represent work turn amber, and only when the count is above zero.
 */
export function StatCard({
  label,
  value,
  caption,
  icon,
  href,
  urgent = false,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
  icon?: NavIconName;
  /** Makes the whole card a link to wherever the work is. */
  href?: string;
  urgent?: boolean;
}) {
  // A zero-valued queue is not urgent, whatever the caller says — there is
  // nothing to do about it.
  const lit = urgent && value !== 0 && value !== "0";

  const body = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-[var(--radius-card)] border p-4 transition-colors",
        lit
          ? "border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)]"
          : "border-[var(--border)] bg-[var(--surface)]",
        href && "hover:border-[var(--accent)]/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-overline uppercase text-[var(--muted)]">{label}</p>

        {icon ? (
          <span
            className={cn(
              "shrink-0 transition-colors",
              lit ? "text-[var(--tone-warning)]" : "text-[var(--faint)] group-hover:text-[var(--accent)]",
            )}
          >
            <NavIcon name={icon} className="size-4" />
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "mt-2 text-3xl font-semibold tracking-tight tabular-nums",
          lit && "text-[var(--tone-warning)]",
        )}
      >
        {value}
      </p>

      {caption ? <p className="mt-1 text-xs text-[var(--muted)]">{caption}</p> : null}
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block h-full rounded-[var(--radius-card)]">
      {body}
    </Link>
  );
}

/** The row these sit in. One place to change how dense the grid is. */
export function StatGrid({
  columns = 3,
  children,
}: {
  columns?: 2 | 3 | 4;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}
