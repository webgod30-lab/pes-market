"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/app/actions/auth-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />

      <Field
        label="Display name"
        name="displayName"
        error={state?.fieldErrors?.displayName}
        hint="What the other party and the admin will see."
      >
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          required
          defaultValue={state?.values?.displayName ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.displayName)}
          className={inputClassName}
          placeholder="Your name or handle"
        />
      </Field>

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

      <Field
        label="Password"
        name="password"
        error={state?.fieldErrors?.password}
        hint="At least 8 characters."
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(state?.fieldErrors?.password)}
          className={inputClassName}
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        One account covers both sides — you can be the seller in one deal and the buyer in another.
      </p>

      <p className="text-center text-sm text-[var(--muted)]">
        Already registered?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
