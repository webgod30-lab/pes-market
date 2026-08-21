"use client";

import { useActionState, useState } from "react";

import { applyToPromoteAction } from "@/app/actions/promoter-actions";
import { AuthFormError } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Alert, Button, Field, fieldDescribedBy, inputClassName } from "@/components/ui";
import type { Locale } from "@/lib/locale";
import { APPLY_FORM } from "@/lib/promoter-copy";

/**
 * Apply to become a promoter.
 *
 * The only form on the site that creates something without a promoter's code,
 * because it is the way in for somebody who has nobody to get one from.
 *
 * The password is taken now rather than after approval so that being approved
 * is one click for the admin and one email for the applicant. It is hashed the
 * moment it reaches the server and cleared entirely if the application is
 * refused.
 *
 * Bank transfer is deliberately not among the payout rails. A payout here is
 * $40 and a flat wire fee takes a quarter of it — percentage fees barely matter
 * at this size, fixed ones are what kill it.
 */
export function PromoterApplyForm({ locale = "en" }: { locale?: Locale }) {
  const [state, formAction, pending] = useActionState(applyToPromoteAction, undefined);
  const copy = APPLY_FORM[locale];

  // Held only to draw the meter. Never submitted separately, never sent
  // anywhere, and dies with the component.
  const [password, setPassword] = useState("");

  // Built here rather than at module scope so the labels follow the language.
  const payoutMethods = [
    { value: "crypto", label: copy.cryptoLabel, detail: copy.cryptoDetail },
    { value: "card", label: copy.paypalLabel, detail: copy.paypalDetail },
    { value: "gift_card", label: copy.giftLabel, detail: copy.giftDetail },
  ];

  // Once it is in, the form has nothing left to do. Replacing it outright beats
  // leaving a filled-in form under a success banner, which reads as "that did
  // not work, try again".
  if (state?.success) {
    return (
      <Alert tone="success">
        <p className="font-medium">{state.success}</p>
        <p className="mt-1.5 text-sm">{copy.doneTail}</p>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Read by the action so its own replies come back in the same language
          the form was filled in. A cookie would work too, but a hidden field
          keeps the answer tied to this submission rather than to whatever the
          language menu was last set to. */}
      <input type="hidden" name="locale" value={locale} />

      <AuthFormError message={state?.message} />

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
          placeholder="you@example.com"
          dir="ltr"
        />
      </Field>

      <Field
        label={copy.channelLabel}
        name="channel"
        error={state?.fieldErrors?.channel}
        hint={copy.channelHint}
      >
        <textarea
          id="channel"
          name="channel"
          required
          rows={4}
          defaultValue={state?.values?.channel ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.channel) || undefined}
          aria-describedby={fieldDescribedBy("channel", {
            hint: copy.channelHint,
            error: state?.fieldErrors?.channel,
          })}
          className={inputClassName}
          placeholder={copy.channelPlaceholder}
        />
      </Field>

      {/* Asked here rather than at the first payout.
          It is the question a prospective promoter has and currently cannot
          find an answer to, and choosing a method while applying quietly makes
          the earnings feel real — a commitment device that costs nothing. */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{copy.payoutLegend}</legend>

        <div className="space-y-2">
          {payoutMethods.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] p-3 transition-colors has-[:checked]:border-[var(--accent)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]"
            >
              <input
                type="radio"
                name="payoutMethod"
                value={option.value}
                required
                defaultChecked={state?.values?.payoutMethod === option.value}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[var(--muted)]">
                  {option.detail}
                </span>
              </span>
            </label>
          ))}
        </div>

        {state?.fieldErrors?.payoutMethod ? (
          <p role="alert" className="mt-1.5 text-xs text-[var(--tone-danger)]">
            {state.fieldErrors.payoutMethod}
          </p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{copy.payoutNote}</p>
        )}
      </fieldset>

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

      <Button type="submit" loading={pending} disabled={pending} block size="md">
        {pending ? copy.submitting : copy.submit}
      </Button>

      <p className="text-center text-xs leading-relaxed text-[var(--muted)]">{copy.foot}</p>
    </form>
  );
}
