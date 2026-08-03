"use server";

// Server actions for registration and login.
//
// These run only on the server, so the password never travels anywhere except
// the POST body of the form submission.
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { registerSchema, loginSchema } from "@/lib/validation";
import { fieldErrorsFrom, type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";
import { clientIp } from "@/lib/client-ip";
import { describeRetryAfter, hitRateLimits, REGISTER_BY_IP } from "@/lib/rate-limit";

/**
 * Only allow relative, single-slash paths as a redirect target, so a crafted
 * ?next=https://evil.example link can't turn our login form into an open
 * redirect.
 */
function safeRedirectTarget(raw: FormDataEntryValue | null, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

export async function registerAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const rawValues = {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  // Echo everything back on failure except the password.
  const echo = {
    displayName: rawValues.displayName,
    email: rawValues.email,
  };

  const parsed = registerSchema.safeParse(rawValues);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: echo };
  }

  const { displayName, email, password } = parsed.data;

  // Registration is limited by address alone — there is no account to key on
  // yet. Checked after validation so a malformed submission does not spend
  // someone's budget, and before the database work so a flood is cheap to
  // refuse.
  try {
    const limit = await hitRateLimits([{ key: `register:ip:${await clientIp()}`, rule: REGISTER_BY_IP }]);

    if (!limit.allowed) {
      return {
        message: `Too many accounts created from here. Try again in ${describeRetryAfter(limit.retryAfterSeconds)}.`,
        values: echo,
      };
    }
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: echo };
    throw error;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return {
        fieldErrors: { email: "An account with this email already exists." },
        values: echo,
      };
    }
  } catch (error) {
    // Without this, "no database" showed up as a blank crash with no hint.
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: echo };
    throw error;
  }

  const passwordHash = await hashPassword(password);

  try {
    // role defaults to "user"; nobody can register themselves as an admin.
    await prisma.user.create({
      data: { displayName, email, passwordHash },
    });
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: echo };

    // Covers the race where two submissions create the same email at once —
    // the unique index rejects the second one.
    return {
      message: "Could not create the account. That email may already be taken.",
      values: echo,
    };
  }

  // Sign the new account in straight away. signIn() redirects by throwing, so
  // this call must not sit inside a try/catch that swallows the throw.
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });

  // Unreachable: signIn always redirects or throws.
  return {};
}

export async function loginAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const rawValues = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const echo = { email: rawValues.email };

  const parsed = loginSchema.safeParse(rawValues);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: echo };
  }

  const { email, password } = parsed.data;

  // We don't know the role until the credentials check passes, so send everyone
  // to /dashboard unless the form asked for somewhere specific. /dashboard
  // forwards admins to /admin.
  const redirectTo = safeRedirectTarget(formData.get("next"), "/dashboard");

  // Sign-in attempts are NOT counted here. They are counted inside
  // authorize(), which is the one place both this form and a direct POST to
  // /api/auth/callback/credentials must pass through. Limiting in both would
  // double-count every attempt from the form and silently halve the real
  // limit for the only people using it honestly.
  const totp = String(formData.get("totp") ?? "").trim();

  try {
    await signIn("credentials", { email, password, totp, redirectTo });
  } catch (error) {
    // A successful sign-in also throws — Next's redirect signal. That is not an
    // AuthError, so it falls through to the rethrow below and works normally.
    if (error instanceof AuthError) {
      // If authorize() blew up because the database is unreachable, NextAuth
      // wraps that failure in an AuthError too. Reporting "wrong password" for
      // an outage sends people hunting for a problem with their account, so
      // check the wrapped cause first.
      const dbProblem = databaseProblemMessage(error);
      if (dbProblem) return { message: dbProblem, values: echo };

      const code = secondFactorCode(error);

      if (code === "rate_limited") {
        // Says nothing about whether the account exists — the same message
        // appears for an address that was never registered.
        return {
          message: "Too many sign-in attempts. Wait a few minutes and try again.",
          values: echo,
        };
      }

      if (code === "totp_required") {
        // Password was right. Ask for the code and keep the form filled in.
        return {
          needsSecondFactor: true,
          message: "Enter the code from your authenticator app.",
          values: echo,
        };
      }

      if (code === "totp_replayed") {
        return {
          needsSecondFactor: true,
          message:
            "That code has already been used. Wait for your app to show the next one, then enter it.",
          values: echo,
        };
      }

      if (code === "totp_invalid") {
        return {
          needsSecondFactor: true,
          message: "That code was not accepted. Try the current one, or a recovery code.",
          values: echo,
        };
      }

      // Same message for "no such user" and "wrong password": don't confirm
      // which emails are registered.
      return {
        message: "Incorrect email or password.",
        values: echo,
      };
    }

    throw error;
  }

  return {};
}

/**
 * Digs the `code` out of a CredentialsSignin subclass.
 *
 * NextAuth does not re-expose it consistently — depending on how the error is
 * wrapped it turns up on the error itself or on its cause — so both are
 * checked rather than trusting one shape.
 */
function secondFactorCode(error: AuthError): string | null {
  const candidates: unknown[] = [error, (error as { cause?: unknown }).cause];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    const code = (candidate as { code?: unknown }).code;

    if (code === "totp_required" || code === "totp_invalid" || code === "totp_replayed" || code === "rate_limited") return code;

    const nested = (candidate as { err?: { code?: unknown } }).err?.code;

    if (nested === "totp_required" || nested === "totp_invalid" || nested === "totp_replayed" || nested === "rate_limited") return nested;
  }

  return null;
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
