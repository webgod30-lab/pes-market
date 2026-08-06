import { Suspense } from "react";

import { getCurrentUserQuietly } from "@/lib/dal";
import { LogoLink } from "@/components/brand";
import { AuthCta } from "@/components/nav/auth-cta";
import { HeaderShell } from "@/components/nav/header-shell";
import { MobileNav } from "@/components/nav/mobile-nav";
import { NavBar } from "@/components/nav/nav-bar";
import { ProfileMenu } from "@/components/nav/profile-menu";
import type { NavUser } from "@/components/nav/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui";

/**
 * The site header.
 *
 * Still a server component. Only the frame and the interactive pieces are
 * client components, and where the navigation can go lives in
 * components/nav/nav-links.ts so the bar, the dropdowns and the mobile sheet
 * cannot describe the same route two different ways.
 *
 * The session lookup happens twice on purpose — once for the bar, once for the
 * sheet — but getCurrentUserQuietly is wrapped in React's cache(), so it is one
 * query per render either way.
 */
export function SiteHeader() {
  return (
    <HeaderShell>
      <div className="flex min-w-0 items-center gap-6">
        <LogoLink size={28} />

        {/* The bar needs the role to decide whether to show a Deals menu, so
            it streams in with the session rather than blocking the logo. */}
        <Suspense fallback={<NavBar role={null} />}>
          <DesktopNav />
        </Suspense>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Outside the Suspense boundaries: switching theme must not wait on a
            database round trip. */}
        <ThemeToggle />

        <Suspense fallback={<Skeleton className="h-9 w-[6.5rem]" />}>
          <AccountArea />
        </Suspense>

        <Suspense fallback={null}>
          <MobileArea />
        </Suspense>
      </div>
    </HeaderShell>
  );
}

/**
 * The signed-in slice of CurrentUser, or null.
 *
 * This is the non-throwing lookup. The header renders in the root layout, and
 * an error thrown here would take down every page — a route-level error.tsx
 * cannot catch a root-layout error. If the database is unreachable the nav
 * degrades to signed-out and the page itself reports the real problem.
 *
 * Safe to do: this only hides account links. It grants nothing — every
 * protected page independently re-checks via the DAL.
 */
async function navUser(): Promise<NavUser | null> {
  const user = await getCurrentUserQuietly();

  if (!user) return null;

  return { displayName: user.displayName, email: user.email, role: user.role };
}

async function DesktopNav() {
  const user = await navUser();

  return <NavBar role={user?.role ?? null} />;
}

async function AccountArea() {
  const user = await navUser();

  return user ? <ProfileMenu user={user} /> : <AuthCta />;
}

async function MobileArea() {
  const user = await navUser();

  return <MobileNav user={user} />;
}
