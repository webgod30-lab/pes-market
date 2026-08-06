"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { registerAction } from "@/app/actions/auth-actions";
import { AuthFormError } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button, Field, fieldDescribedBy, inputClassName } from "@/components/ui";

/** Named once so the visible hint and its aria-describedby cannot disagree. */
const NAME_HINT = "What the other party and the admin will see.";
const PASSWORD_HINT = "At least 8 characters. Length matters more than symbols.";

/**
 * Create an account.
 *
 * `registerAction` and `registerSchema` are untouched: 8 to 72 characters is
 * still exactly what is accepted. The strength meter below is advice shown
 * while typing and has no say in whether the form submits — see the note in
 * password-strength.tsx.
 */
export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  // Held only to draw the meter. It is never submitted separately, never sent
  // anywhere, and dies with the component.
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <AuthFormError message={state?.message} />

      <Field
        label="Display name"
        name="displayName"
        error={state?.fieldErrors?.displayName}
        hint={NAME_HINT}
      >
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          required
          defaultValue={state?.values?.displayName ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.displayName) || undefined}
          aria-describedby={fieldDescribedBy("displayName", {
            hint: NAME_HINT,
            error: state?.fieldErrors?.displayName,
          })}
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
          aria-invalid={Boolean(state?.fieldErrors?.email) || undefined}
          aria-describedby={fieldDescribedBy("email", { error: state?.fieldErrors?.email })}
          className={inputClassName}
          placeholder="you@example.com"
        />
      </Field>

      <Field
        label="Password"
        name="password"
        error={state?.fieldErrors?.password}
        hint={PASSWORD_HINT}
      >
        <PasswordInput
          name="password"
          autoComplete="new-password"
          minLength={8}
          invalid={Boolean(state?.fieldErrors?.password)}
          describedBy={fieldDescribedBy("password", {
            hint: PASSWORD_HINT,
            error: state?.fieldErrors?.password,
          })}
          onValueChange={setPassword}
        />
        <PasswordStrength value={password} />
      </Field>

      {/* Said before the button, not after. There is no password reset on this
          service, so choosing something memorable is not a preference — it is
          the difference between keeping the account and losing it. */}
      <p className="rounded-[var(--radius-control)] border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] px-3 py-2.5 text-xs leading-relaxed text-[var(--tone-warning)]">
        <strong className="font-semibold">There is no password reset yet.</strong> Use a password
        manager, or pick something you will not forget —{" "}
        <Link href="/forgot-password" className="underline">
          recovering an account
        </Link>{" "}
        currently means contacting us.
      </p>

      <Button type="submit" loading={pending} disabled={pending} block size="md">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
        One account covers both sides — you can be the seller in one deal and the buyer in another.
      </p>
    </form>
  );
}
