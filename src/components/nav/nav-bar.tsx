"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu, MenuRow } from "@/components/nav/menu";
import { NavIcon } from "@/components/nav/nav-icons";
import { PRIMARY_LINK, RESOURCES, dealsGroup, type NavGroup } from "@/components/nav/nav-links";
import { cn } from "@/components/ui";
import type { Role } from "@/generated/prisma/client";
import { translator } from "@/lib/dictionary";
import type { Locale } from "@/lib/locale";

/**
 * The desktop bar.
 *
 * Signed out this is one link and one dropdown; signed in it gains a Deals
 * menu. The old header put "Open a deal" and "Balance" in the bar as loose
 * links that only appeared above 1024px and vanished below it with no
 * replacement — the actions were simply unreachable between 768 and 1024.
 * Grouping them into a dropdown means they survive at every desktop width.
 */
export function NavBar({ role, locale }: { role: Role | null; locale: Locale }) {
  // Built here, not passed in: a function cannot cross the server/client
  // boundary, and translator() is a pure lookup over a plain string.
  const t = translator(locale);
  return (
    <nav aria-label="Main" className="hidden items-center gap-0.5 text-sm md:flex">
      {role ? <GroupMenu group={dealsGroup(role)} locale={locale} /> : null}

      <NavLink href={PRIMARY_LINK.href}>{t(PRIMARY_LINK.labelKey)}</NavLink>

      <GroupMenu group={RESOURCES} locale={locale} />
    </nav>
  );
}

/**
 * A single bar link.
 *
 * The active state is an underline that grows from the centre rather than a
 * filled pill: the bar sits on glass, and a solid background on one item makes
 * the whole strip look like it has a hole punched in it.
 */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = useIsActive(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={barItemClass(active)}
    >
      {children}
      <ActiveUnderline active={active} />
    </Link>
  );
}

/**
 * How anything sitting directly in the bar looks.
 *
 * Links and dropdown triggers are different elements but the same control, and
 * they sit next to each other — so the padding, radius and hover treatment come
 * from here rather than being typed out at each one.
 */
function barItemClass(active: boolean): string {
  return cn(
    "group relative flex items-center gap-1.5 rounded-[var(--radius-control)] px-3 py-2 transition-colors",
    active
      ? "text-[var(--foreground)]"
      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
  );
}

/**
 * The mark under the current section.
 *
 * Always rendered, scaled to nothing when inactive, so moving between routes
 * animates the width rather than popping an element into existence. Shared by
 * the plain links and the dropdown triggers — they sit side by side in the same
 * strip and any difference between them would be visible.
 */
function ActiveUnderline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-x-3 -bottom-px h-0.5 origin-center rounded-full bg-[var(--accent)]",
        "transition-transform duration-200 ease-out motion-reduce:transition-none",
        active ? "scale-x-100" : "scale-x-0",
      )}
    />
  );
}

/** A bar item that opens a menu of related routes. */
function GroupMenu({ group, locale }: { group: NavGroup; locale: Locale }) {
  const t = translator(locale);
  const pathname = usePathname();
  const active = group.items.some((item) => isActive(pathname, item.href));

  return (
    <Menu
      label={group.labelKey ? t(group.labelKey) : ""}
      align="start"
      panelClassName="w-[22rem]"
      triggerClassName={barItemClass(active)}
      trigger={({ open }) => (
        <>
          {group.labelKey ? t(group.labelKey) : null}
          <Chevron open={open} />
          <ActiveUnderline active={active} />
        </>
      )}
    >
      {group.items.map((item) => (
        <MenuRow
          key={item.href}
          as={Link}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          icon={<NavIcon name={item.icon} />}
          title={t(item.labelKey)}
          description={item.descriptionKey ? t(item.descriptionKey) : undefined}
        />
      ))}
    </Menu>
  );
}

export function Chevron({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(
        "size-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none",
        open && "rotate-180",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9.5l6 6 6-6" />
    </svg>
  );
}

/**
 * Whether a link points at where we already are.
 *
 * Prefix-matching on a trailing slash, so /deals/new lights up its parent
 * section without /dealsomething also matching. "/" is exact — otherwise the
 * home link would be active on every page in the site.
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useIsActive(href: string): boolean {
  return isActive(usePathname(), href);
}
