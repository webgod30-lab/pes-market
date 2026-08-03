import Link from "next/link";
import { Suspense } from "react";

import { getCurrentUserQuietly } from "@/lib/dal";
import { signOutAction } from "@/app/actions/auth-actions";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoLink } from "@/components/logo";
import { Badge, Button, ButtonLink } from "@/components/ui";

/** Shown to everyone, in both the desktop bar and the mobile sheet. */
const PUBLIC_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/reviews", label: "Reviews" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <LogoLink size={28} />

        {/* Desktop navigation. Hidden on phones, where the sheet takes over. */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Outside the Suspense boundaries below: switching theme must not
              wait on a database round trip. */}
          <ThemeToggle />

          {/* Session lookup hits the database, so it streams in separately
              instead of delaying the whole header. */}
          <Suspense
            fallback={<div className="h-9 w-24 animate-pulse rounded-lg bg-[var(--surface-2)]" />}
          >
            <AccountArea />
          </Suspense>

          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/** The mobile sheet gets the account links too, since they are hidden up top. */
async function MobileNav() {
  const user = await getCurrentUserQuietly();

  const links = [...PUBLIC_LINKS];

  if (user) {
    links.unshift(
      { href: user.role === "admin" ? "/admin" : "/dashboard", label: "Your deals" },
      ...(user.role === "admin" ? [] : [{ href: "/deals/new", label: "Open a deal" }]),
      { href: "/deals/join", label: "Join with a code" },
      { href: "/settings/security", label: "Security" },
    );
  }

  return (
    <MobileMenu
      links={links}
      footer={
        user ? (
          <form action={signOutAction}>
            <p className="mb-2 px-3 text-xs text-[var(--muted)]">Signed in as {user.displayName}</p>
            <Button type="submit" variant="secondary" className="w-full">
              Sign out
            </Button>
          </form>
        ) : (
          <div className="space-y-2">
            <ButtonLink href="/register" className="w-full">
              Create an account
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" className="w-full">
              Sign in
            </ButtonLink>
          </div>
        )
      }
    />
  );
}

async function AccountArea() {
  // The header renders in the root layout, and an error thrown here would take
  // down every page — a route-level error.tsx cannot catch a root-layout error.
  // So this lookup is the non-throwing one: if the database is unreachable the
  // nav degrades to signed-out and the page itself reports the real problem.
  //
  // Safe to do: this only hides account links. It grants nothing — every
  // protected page independently re-checks via the DAL.
  const user = await getCurrentUserQuietly();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <ButtonLink href="/login" variant="secondary" className="px-3 py-2 text-xs sm:text-sm">
          Sign in
        </ButtonLink>
        <ButtonLink href="/register" className="hidden px-3 py-2 text-xs sm:inline-flex sm:text-sm">
          Get started
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.role === "admin" ? null : (
        <Link
          href="/deals/new"
          className="hidden rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] lg:inline"
        >
          Open a deal
        </Link>
      )}

      {/* The name is hidden on phones for space, and a plain user has no admin
          badge — which left this link with nothing inside it at all: an
          invisible, unlabelled 16x12 target that still navigated to the
          dashboard. The initial gives it something to draw and something to
          announce at every width. */}
      <Link
        href={user.role === "admin" ? "/admin" : "/dashboard"}
        aria-label={`${user.displayName} — your deals`}
        className="flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 hover:bg-[var(--surface-2)]"
      >
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-xs font-semibold text-[var(--accent)]"
        >
          {user.displayName.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="hidden max-w-[10ch] truncate text-sm sm:inline">{user.displayName}</span>
        {user.role === "admin" ? <Badge tone="warning">admin</Badge> : null}
      </Link>

      <Link
        href="/settings/security"
        title="Security"
        aria-label="Security settings"
        className="hidden rounded-lg px-2 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] sm:inline-flex"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3l7 2.5V11c0 4.4-2.9 7.7-7 9-4.1-1.3-7-4.6-7-9V5.5L12 3z"
          />
          <circle cx="12" cy="11" r="1.6" fill="currentColor" stroke="none" />
          <path strokeLinecap="round" d="M12 12.6v2.4" />
        </svg>
      </Link>

      <form action={signOutAction} className="hidden sm:block">
        <Button type="submit" variant="secondary" className="px-3 py-2 text-xs sm:text-sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
