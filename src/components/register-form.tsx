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
const REFERRAL_HINT = "Looks like PES-7F3K9Q. Whoever invited you has one.";

/**
 * Create an account.
 *
 * `registerAction` and `registerSchema` are untouched: 8 to 72 characters is
 * still exactly what is accepted. The strength meter below is advice shown
 * while typing and has no say in whether the form submits — see the note in
 * password-strength.tsx.
 *
 * `initialReferralCode` comes from ?ref= on a promoter's share link. Someone
 * arriving that way should not have to copy anything by hand, and someone
 * arriving without it still gets an empty box they can paste into.
 */
export function RegisterForm({ initialReferralCode = "" }: { initialReferralCode?: string }) {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  // Held only to draw the meter. It is never submitted separately, never sent
  // anywhere, and dies with the component.
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <AuthFormError message={state?.message} />

      {/* First, because it is the gate. Everything else on this form is wasted
          effort if the person does not have one, and finding that out after
          choosing a password is the worst moment to be told. */}
      <Field
        label="Promoter's code"
        name="referralCode"
        error={state?.fieldErrors?.referralCode}
        hint={REFERRAL_HINT}
      >
        <input
          id="referralCode"
          name="referralCode"
          type="text"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          defaultValue={state?.values?.referralCode ?? initialReferralCode}
          aria-invalid={Boolean(state?.fieldErrors?.referralCode) || undefined}
          aria-describedby={fieldDescribedBy("referralCode", {
            hint: REFERRAL_HINT,
            error: state?.fieldErrors?.referralCode,
          })}
          className={`${inputClassName} font-mono uppercase tracking-wider`}
          placeholder="PES-XXXXXX"
        />
      </Field>

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
        One account covers both sides of a swap — and comes with a promoter code of your own, so you
        can earn from everyone you bring in.
      </p>
    </form>
  );
}
