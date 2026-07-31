// Data Access Layer — the authorization boundary. SERVER ONLY.
//
// Why this exists instead of trusting the session cookie directly:
//
//   1. The JWT is a snapshot from sign-in time. If you ban a user or change
//      their role, their existing token still claims the old values. These
//      helpers re-read the user row, so a ban takes effect on the next request.
//   2. Next.js layouts do not re-render on client-side navigation, so an auth
//      check in a layout can be skipped. Call these in each protected *page*.
//
// src/proxy.ts also redirects logged-out visitors, but that is only a UX
// shortcut — this file is what actually enforces access.
import { cache } from "react";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { describeDatabaseProblemDeep, type DatabaseSetupProblem } from "@/lib/db-errors";
import type { Role } from "@/generated/prisma/client";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: Date;
};

/**
 * The signed-in user, or null. Never throws, never redirects — use it for
 * things like the nav bar that render differently when logged out.
 *
 * Wrapped in React's `cache()` so calling it several times while rendering one
 * request hits the database once.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
      isBanned: true,
    },
  });

  // Deleted or banned since the token was issued.
  if (!user || user.isBanned) return null;

  // Built explicitly rather than spread, so isBanned cannot leak into what
  // pages receive.
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  };
});

/** Requires any signed-in user. Redirects to /login otherwise. */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    const target = returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
    redirect(target);
  }

  return user;
}

/**
 * Requires one of `roles`.
 *
 * A signed-in user with the wrong role gets a 404 rather than a "forbidden"
 * page: that way /admin does not confirm it exists to people who should not
 * know about it.
 */
export async function requireRole(roles: Role[], returnTo?: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);

  if (!roles.includes(user.role)) notFound();

  return user;
}

export function requireAdmin(returnTo?: string): Promise<CurrentUser> {
  return requireRole(["admin"], returnTo);
}

/**
 * Like getCurrentUser, but never throws.
 *
 * For places where the session is a nicety rather than a gate — the nav bar, the
 * landing page, the login form. If the database is unreachable these should
 * still render as "signed out" rather than blowing up the whole page; the login
 * form in particular has to render so the user can see the real error when they
 * submit it.
 */
export async function getCurrentUserQuietly(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export type AuthOrProblem = { user: CurrentUser; problem?: never } | { problem: DatabaseSetupProblem; user?: never };

/**
 * For protected pages. Returns either the user, or a described setup problem the
 * page can render server-side.
 *
 * This exists because a client `error.tsx` boundary only ever receives a
 * sanitized error — Next.js strips server error details before they reach the
 * browser — so "the database is down" has to be turned into a message here, on
 * the server, while the real error is still in hand.
 */
export async function requireUserOrProblem(
  roles: Role[] | null,
  returnTo?: string,
): Promise<AuthOrProblem> {
  let user: CurrentUser | null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    const problem = describeDatabaseProblemDeep(error);
    if (problem) return { problem };
    throw error;
  }

  // Deliberately outside the try: redirect() and notFound() work by throwing,
  // and catching them here would break both.
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }

  if (roles && !roles.includes(user.role)) notFound();

  return { user };
}
