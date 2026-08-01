import Link from "next/link";
import { Suspense } from "react";

import { getCurrentUserQuietly } from "@/lib/dal";
import { signOutAction } from "@/app/actions/auth-actions";
import { MobileMenu } from "@/components/mobile-menu";
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

      <Link
        href={user.role === "admin" ? "/admin" : "/dashboard"}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-2)]"
      >
        <span className="hidden max-w-[10ch] truncate text-sm sm:inline">{user.displayName}</span>
        {user.role === "admin" ? <Badge tone="warning">admin</Badge> : null}
      </Link>

      <form action={signOutAction} className="hidden sm:block">
        <Button type="submit" variant="secondary" className="px-3 py-2 text-xs sm:text-sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
