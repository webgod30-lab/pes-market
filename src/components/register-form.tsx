"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { registerAction } from "@/app/actions/auth-actions";
import { AuthFormError } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button, Field, fieldDescribedBy, inputClassName } from "@/components/ui";
import { REGISTER_FORM } from "@/lib/auth-copy";
import type { Locale } from "@/lib/locale";

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
export function RegisterForm({
  initialReferralCode = "",
  locale = "en",
}: {
  initialReferralCode?: string;
  locale?: Locale;
}) {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const copy = REGISTER_FORM[locale];

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
        label={copy.referralLabel}
        name="referralCode"
        error={state?.fieldErrors?.referralCode}
        hint={copy.referralHint}
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
            hint: copy.referralHint,
            error: state?.fieldErrors?.referralCode,
          })}
          className={`${inputClassName} font-mono uppercase tracking-wider`}
          placeholder={copy.referralPlaceholder}
        />
      </Field>

      <Field
        label={copy.nameLabel}
        name="displayName"
        error={state?.fieldErrors?.displayName}
        hint={copy.nameHint}
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
            hint: copy.nameHint,
            error: state?.fieldErrors?.displayName,
          })}
          className={inputClassName}
          placeholder={copy.namePlaceholder}
        />
      </Field>

      <Field label={copy.emailLabel} name="email" error={state?.fieldErrors?.email}>
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
          placeholder={copy.emailPlaceholder}
        />
      </Field>

      <Field
        label={copy.passwordLabel}
        name="password"
        error={state?.fieldErrors?.password}
        hint={copy.passwordHint}
      >
        <PasswordInput
          name="password"
          autoComplete="new-password"
          minLength={8}
          invalid={Boolean(state?.fieldErrors?.password)}
          describedBy={fieldDescribedBy("password", {
            hint: copy.passwordHint,
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
        <strong className="font-semibold">{copy.noResetBold}</strong> {copy.noResetBody}{" "}
        <Link href="/forgot-password" className="underline">
          {copy.noResetLink}
        </Link>{" "}
        {copy.noResetTail}
      </p>

      <Button type="submit" loading={pending} disabled={pending} block size="md">
        {pending ? copy.creatingAccount : copy.createAccount}
      </Button>

      <p className="text-center text-xs leading-relaxed text-[var(--muted)]">{copy.footNote}</p>
    </form>
  );
}
