"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/app/actions/auth-actions";
import { Avatar, Identity } from "@/components/nav/identity";
import { Chevron, isActive } from "@/components/nav/nav-bar";
import { Menu, MenuRow } from "@/components/nav/menu";
import { NavIcon } from "@/components/nav/nav-icons";
import { accountLinks, type NavUser } from "@/components/nav/nav-links";
import { cn } from "@/components/ui";
import type { Translate } from "@/lib/dictionary";

/**
 * The account menu.
 *
 * This replaces four separate controls that used to sit in the bar — a
 * dashboard link, a shield icon, a name and a sign-out button — each hidden at
 * a different breakpoint. Collapsing them behind one avatar means the account
 * area is the same shape at every width, and there is room to say who you are
 * signed in as, which the bar never had.
 */
export function ProfileMenu({ user, t }: { user: NavUser; t: Translate }) {
  const pathname = usePathname();
  const links = accountLinks(user.role);

  return (
    <Menu
      label={`Account menu for ${user.displayName}`}
      align="end"
      panelClassName="w-64"
      triggerClassName={cn(
        "flex items-center gap-2 rounded-[var(--radius-pill)] py-1 ps-1 pe-2",
        "border border-[var(--glass-border)] bg-[var(--surface-2)]/60 transition-colors",
        "hover:bg-[var(--surface-2)]",
      )}
      trigger={({ open }) => (
        <>
          <Avatar name={user.displayName} size="sm" />
          {/* The name is for people with room for it; the avatar and the
              aria-label carry the meaning everywhere else. */}
          <span className="hidden max-w-[10ch] truncate text-sm lg:inline">{user.displayName}</span>
          <Chevron open={open} className="text-[var(--muted)]" />
        </>
      )}
    >
      {/* Who you are. Worth the space: this is an escrow service, and knowing
          which of two accounts you are currently acting as matters. */}
      <div className="flex items-center gap-3 px-2.5 pb-2.5 pt-2">
        <Identity user={user} />
      </div>

      <div className="my-1 h-px bg-[var(--border)]" />

      {links.map((item) => (
        <MenuRow
          key={item.href}
          as={Link}
          variant="compact"
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          icon={<NavIcon name={item.icon} className="size-4" />}
          title={t(item.labelKey)}
        />
      ))}

      <div className="my-1 h-px bg-[var(--border)]" />

      <form action={signOutAction}>
        <MenuRow
          as="button"
          variant="compact"
          type="submit"
          icon={<SignOutIcon />}
          title={t("account.signOut")}
          className="text-[var(--tone-danger)] hover:bg-[var(--tone-danger-bg)]"
        />
      </form>
    </Menu>
  );
}

function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4h3.5A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5H14" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </svg>
  );
}
