// NextAuth (Auth.js v5) configuration. SERVER ONLY.
//
// Strategy: JWT sessions with a Credentials provider (email + password).
// A database session strategy is not available with Credentials, and a JWT
// keeps us to the seven models in the schema — no Account/Session tables.
//
// The JWT carries the user id and role so the UI can render quickly, but it is
// a *cache*, not the source of truth: a token stays valid until it expires, so
// a ban or role change would not show up. Everything that actually matters
// re-reads the user from the database in src/lib/dal.ts.
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { equalizeFailedLoginTiming, verifyPassword } from "@/lib/passwords";
import { loginSchema } from "@/lib/validation";
import { checkSecondFactor } from "@/lib/totp";
import {
  clearRateLimit,
  hitRateLimit,
  hitRateLimits,
  LOGIN_BY_ACCOUNT,
  LOGIN_BY_IP,
  TOTP_BY_ACCOUNT,
} from "@/lib/rate-limit";

/**
 * Thrown when the password was right but the second factor was not supplied.
 *
 * The `code` travels back to the sign-in form so it can reveal the code field.
 * This does tell whoever triggered it that the account uses two-factor — but
 * only after they have already produced the correct password, at which point
 * they will find out the moment they try again anyway.
 */
export class SecondFactorRequired extends CredentialsSignin {
  code = "totp_required";
}

/** Thrown when a supplied second factor was wrong or expired. */
export class SecondFactorInvalid extends CredentialsSignin {
  code = "totp_invalid";
}

/**
 * Thrown when the code was right but its 30-second step has already been used.
 *
 * Separate from "invalid" because the fix is different and non-obvious: the
 * app is showing a code that looks perfectly current, and the only thing to do
 * is wait for the next one. Told it was "incorrect", people go hunting for a
 * clock problem that does not exist.
 */
export class SecondFactorReplayed extends CredentialsSignin {
  code = "totp_replayed";
}

/** Thrown when too many sign-in attempts have been made. */
export class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

/**
 * Client address for rate limiting, taken from the request authorize() is
 * given rather than from next/headers — authorize() runs inside the Auth.js
 * handler, which is not a request scope next/headers can read.
 *
 * Behind Vercel the leftmost x-forwarded-for entry is written by the proxy.
 * Anywhere else it is forgeable, which is why nothing depends on it alone:
 * the per-account limit below uses the submitted email, which no header can
 * influence.
 */
function addressOf(request: Request | undefined): string {
  const forwarded = request?.headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request?.headers.get("x-real-ip")?.trim() || "unknown";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  // Local development over plain http.
  trustHost: true,
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "Authentication code", type: "text" },
      },
      async authorize(rawCredentials, request) {
        const parsed = loginSchema.safeParse(rawCredentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const submittedTotp =
          typeof rawCredentials?.totp === "string" ? rawCredentials.totp : undefined;

        // Rate limiting lives HERE, not in the sign-in server action, because
        // /api/auth/callback/credentials is a public endpoint that reaches
        // this function without going near the action. Limiting the action
        // alone protected only people using the form — which is nobody an
        // attacker cares about.
        //
        // Counted before the password is checked. A limiter that only counts
        // failures lets an attacker who occasionally guesses right keep going
        // indefinitely.
        const attemptLimit = await hitRateLimits([
          { key: `login:email:${email}`, rule: LOGIN_BY_ACCOUNT },
          { key: `login:ip:${addressOf(request)}`, rule: LOGIN_BY_IP },
        ]);

        if (!attemptLimit.allowed) throw new TooManyAttempts();

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            passwordHash: true,
            isBanned: true,
          },
        });

        if (!user) {
          // Spend the same time as a real check so timing can't reveal
          // whether this email is registered.
          await equalizeFailedLoginTiming(password);
          return null;
        }

        const passwordMatches = await verifyPassword(password, user.passwordHash);

        if (!passwordMatches) return null;

        // Banned users simply cannot sign in. Returning null (rather than a
        // distinct error) keeps the failure message uniform.
        if (user.isBanned) return null;

        // --- second factor, if this account has one -----------------------
        //
        // Limited separately from the password: a six-digit code is guessable
        // at volume, and by this point the attacker already has the password,
        // so the login limiter may well have been reset by their own success.
        const totpGate = await hitRateLimit(`totp:user:${user.id}`, TOTP_BY_ACCOUNT);

        if (!totpGate.allowed) throw new SecondFactorInvalid();

        const secondFactor = await checkSecondFactor(user.id, submittedTotp);

        if (secondFactor.status === "missing") throw new SecondFactorRequired();
        if (secondFactor.status === "replayed") throw new SecondFactorReplayed();
        if (secondFactor.status === "rejected") throw new SecondFactorInvalid();

        // Everything checked out. Clearing the per-account counters here means
        // someone who fumbled their password a few times is not left one
        // attempt from a lockout for the rest of the window. The per-IP
        // counter is deliberately left alone — one success should not refund
        // the budget for spraying other accounts.
        await clearRateLimit(`login:email:${email}`);
        await clearRateLimit(`totp:user:${user.id}`);

        // Whatever is returned here lands in the `user` argument of jwt().
        // Note it never includes passwordHash.
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Runs on sign-in (with `user`) and on every subsequent token read.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    // Shapes what `auth()` and `useSession()` expose.
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
});
