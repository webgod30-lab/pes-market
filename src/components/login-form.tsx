"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth-actions";
import { AuthFormError } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Button, Field, fieldDescribedBy, inputClassName } from "@/components/ui";
import { LOGIN_FORM } from "@/lib/auth-copy";
import type { Locale } from "@/lib/locale";

/**
 * Sign in.
 *
 * The action, the field names and the two-factor handshake are exactly as they
 * were — `loginAction` decides everything, including when the code field
 * appears. Only the surface changed.
 */
export function LoginForm({ next, locale = "en" }: { next?: string; locale?: Locale }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const copy = LOGIN_FORM[locale];

  const secondFactor = Boolean(state?.needsSecondFactor);

  return (
    <form action={formAction} className="space-y-4">
      <AuthFormError message={state?.message} />

      {next ? <input type="hidden" name="next" value={next} /> : null}

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
        labelSuffix={
          <Link
            href="/forgot-password"
            // inline-flex + min-h-9 for a real tap target; the negative margin
            // pulls the extra height back out so the label row keeps its
            // rhythm. As bare inline text this was 16px tall, sitting right
            // beside a field people are trying to tap.
            className="-my-2 inline-flex min-h-9 items-center text-xs text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          >
            {copy.forgotPassword}
          </Link>
        }
      >
        <PasswordInput
          name="password"
          autoComplete="current-password"
          invalid={Boolean(state?.fieldErrors?.password)}
          describedBy={fieldDescribedBy("password", { error: state?.fieldErrors?.password })}
        />
      </Field>

      {/* Appears only once the password has been accepted, so the form never
          asks for a code from someone who does not have two-factor on. The
          password field stays mounted and must be retyped: keeping a correct
          password sitting in the DOM while waiting for a phone is exactly the
          window an unattended screen creates. */}
      {secondFactor ? (
        <div className="auth-enter rounded-[var(--radius-control)] border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] p-3">
          <Field
            label={copy.totpLabel}
            name="totp"
            error={state?.fieldErrors?.totp}
            hint={copy.totpHint}
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
              aria-invalid={Boolean(state?.fieldErrors?.totp) || undefined}
              aria-describedby={fieldDescribedBy("totp", {
                hint: copy.totpHint,
                error: state?.fieldErrors?.totp,
              })}
              className={`${inputClassName} text-center font-mono text-base tracking-[0.35em]`}
              placeholder={copy.totpPlaceholder}
            />
          </Field>
        </div>
      ) : null}

      <Button type="submit" loading={pending} disabled={pending} block size="md">
        {pending ? copy.signingIn : secondFactor ? copy.verifyAndSignIn : copy.signIn}
      </Button>
    </form>
  );
}
