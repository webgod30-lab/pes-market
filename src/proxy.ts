// Proxy (called "Middleware" before Next.js 16).
//
// This is an OPTIMISTIC check only: it looks for the presence of a session
// cookie and bounces obviously-logged-out visitors to /login so they don't
// watch a protected page render and then vanish.
//
// It deliberately does NOT verify the cookie's signature, read the database, or
// check roles. Proxy runs on every matched request and cannot safely reach the
// database, and Next.js explicitly warns against using it as the authorization
// layer. The real enforcement is src/lib/dal.ts, called inside each page.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Route prefixes that require *some* signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/deals"];

// Auth.js names the cookie "authjs.session-token", prefixed with "__Secure-"
// when served over https.
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skip static assets and the auth endpoints themselves.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
