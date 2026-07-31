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

  try {
    await signIn("credentials", { email, password, redirectTo });
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

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
