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

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        No account yet?{" "}
        <Link href="/register" className="text-emerald-400 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
