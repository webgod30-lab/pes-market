"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field label="Email" name="email" error={state?.fieldErrors?.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.email)}
          className={inputClassName}
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" name="password" error={state?.fieldErrors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClassName}
          placeholder="••••••••"
        />
      </Field>

      {/* Appears only once the password has been accepted, so the form never
          asks for a code from someone who does not have two-factor on. The
          password field stays mounted and must be retyped: keeping a correct
          password sitting in the DOM while waiting for a phone is exactly the
          window an unattended screen creates. */}
      {state?.needsSecondFactor ? (
        <Field
          label="Authentication code"
          name="totp"
          error={state?.fieldErrors?.totp}
          hint="The six-digit code from your authenticator app, or one of your recovery codes."
        >
          <input
            id="totp"
            name="totp"
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={16}
            className={`${inputClassName} font-mono tracking-widest`}
            placeholder="123456"
          />
        </Field>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : state?.needsSecondFactor ? "Verify and sign in" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        No account yet?{" "}
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
