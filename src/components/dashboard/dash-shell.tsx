"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { NavIcon } from "@/components/nav/nav-icons";
import type { DashGroup } from "@/components/dashboard/dash-nav";
import { cn } from "@/components/ui";

/**
 * The signed-in layout: a rail on the left, the page on the right.
 *
 * Below `lg` the rail becomes a horizontal strip that scrolls, which is what
 * the admin console already did — a stack of eight full-width rows above the
 * content would push the actual page off a phone screen entirely. The strip
 * keeps the icons and drops the group labels, since the groups only exist to
 * organise a vertical list.
 *
 * A client component solely to read the pathname for the active row. Everything
 * inside it is passed in already rendered.
 */
export function DashShell({
  groups,
  title,
  description,
  actions,
  children,
}: {
  groups: DashGroup[];
  title: string;
  description?: ReactNode;
  /** Buttons for the page as a whole — "Open a deal", filters. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg:flex lg:gap-8">
      <DashRail groups={groups} />

      <div className="min-w-0 flex-1">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
            {description ? (
              <div className="mt-1.5 text-sm text-[var(--muted)]">{description}</div>
            ) : null}
          </div>

          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </header>

        {children}
      </div>
    </div>
  );
}

/**
 * Which rail row is the current one.
 *
 * Longest match wins, and that is the whole trick. Every admin route starts
 * with `/admin`, so a plain prefix test lights "Overview" on the users page as
 * well as the real row; a plain equality test stops lighting "Deals" as soon as
 * you open a deal. Picking the most specific href that the path is under gets
 * both right, and needs no per-item configuration.
 */
function activeHref(pathname: string, groups: DashGroup[]): string | null {
  const candidates = groups
    .flatMap((group) => group.items)
    .map((item) => item.href)
    // Ignore query strings — two rows never differ only by one.
    .map((href) => href.split("?")[0])
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`));

  if (candidates.length === 0) return null;

  return candidates.reduce((best, href) => (href.length > best.length ? href : best));
}

function DashRail({ groups }: { groups: DashGroup[] }) {
  const pathname = usePathname();
  const current = activeHref(pathname, groups);

  return (
    <nav aria-label="Dashboard" className="mb-6 lg:mb-0 lg:w-56 lg:shrink-0">
      {/* Sticky under the 64px header, with a little air. Only from `lg`,
          because the horizontal strip below that scrolls with the page. */}
      <div className="lg:sticky lg:top-20">
        {/* --- phone and tablet: one scrolling strip --- */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden">
          <ul className="flex w-max gap-1">
            {groups.flatMap((group) => group.items).map((item) => (
              <li key={item.key}>
                <RailLink item={item} current={current} compact />
              </li>
            ))}
          </ul>
        </div>

        {/* --- desktop: grouped vertical rail --- */}
        <div className="hidden lg:block">
          {groups.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <h2 className="mb-1.5 px-3 text-overline uppercase text-[var(--muted)]">
                {group.label}
              </h2>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <RailLink item={item} current={current} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

function RailLink({
  item,
  current,
  compact = false,
}: {
  item: DashGroup["items"][number];
  /** The winning href from activeHref, or null when nothing matches. */
  current: string | null;
  compact?: boolean;
}) {
  const active = current !== null && item.href.split("?")[0] === current;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-[var(--radius-control)] transition-colors",
        compact ? "whitespace-nowrap px-3 py-2 text-sm" : "px-3 py-2 text-sm",
        active
          ? "bg-[var(--tone-success-bg)] font-medium text-[var(--tone-success)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
      )}
    >
      <NavIcon
        name={item.icon}
        className={cn("size-4 shrink-0", active ? "text-[var(--accent)]" : undefined)}
      />
      <span className={compact ? undefined : "min-w-0 flex-1 truncate"}>{item.label}</span>

      {/* Zero is not shown. A queue with nothing in it should read as absent,
          not as a thing with a value of nothing. */}
      {item.badge ? (
        <span
          className={cn(
            "ms-auto grid min-w-5 shrink-0 place-items-center rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums",
            active
              ? "bg-[var(--accent)] text-[var(--background)]"
              : "bg-[var(--tone-warning-bg)] text-[var(--tone-warning)]",
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
