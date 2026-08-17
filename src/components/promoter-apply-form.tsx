"use client";

import { useActionState, useState } from "react";

import { applyToPromoteAction } from "@/app/actions/promoter-actions";
import { AuthFormError } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Alert, Button, Field, fieldDescribedBy, inputClassName } from "@/components/ui";

/**
 * The three rails offered, and who each is for.
 *
 * Bank transfer is deliberately absent. Payouts here are $10 to $40, and a flat
 * wire fee takes a quarter of that — percentage fees barely matter at this
 * size, fixed ones are what kill it.
 */
const PAYOUT_METHODS = [
  {
    value: "crypto",
    label: "USDT (TRC-20)",
    detail: "Arrives in minutes, costs almost nothing to send, and needs no bank account.",
  },
  {
    value: "card",
    label: "PayPal",
    detail: "One to two days, sent in US dollars. Their conversion and withdrawal fees are theirs, not ours.",
  },
  {
    value: "gift_card",
    label: "Gift card — Steam, Amazon or Google Play",
    detail: "Instant. The one that works if you have no bank account, or you are under 18.",
  },
] as const;

const NAME_HINT = "What people will see next to your code.";
const PASSWORD_HINT = "At least 8 characters. You will use this to sign in once you are approved.";
const CHANNEL_HINT = "A Discord server, a YouTube channel, a group chat — and roughly how many people.";

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
 */
export function PromoterApplyForm() {
  const [state, formAction, pending] = useActionState(applyToPromoteAction, undefined);

  // Held only to draw the meter. Never submitted separately, never sent
  // anywhere, and dies with the component.
  const [password, setPassword] = useState("");

  // Once it is in, the form has nothing left to do. Replacing it outright beats
  // leaving a filled-in form under a success banner, which reads as "that did
  // not work, try again".
  if (state?.success) {
    return (
      <Alert tone="success">
        <p className="font-medium">{state.success}</p>
        <p className="mt-1.5 text-sm">
          Nothing else to do for now. Applications are read by hand, so it will not be instant.
        </p>
      </Alert>
    );
  }

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
        label="Where would you promote it?"
        name="channel"
        error={state?.fieldErrors?.channel}
        hint={CHANNEL_HINT}
      >
        <textarea
          id="channel"
          name="channel"
          required
          rows={4}
          defaultValue={state?.values?.channel ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.channel) || undefined}
          aria-describedby={fieldDescribedBy("channel", {
            hint: CHANNEL_HINT,
            error: state?.fieldErrors?.channel,
          })}
          className={inputClassName}
          placeholder="I run a 4,000-member eFootball Discord where people arrange account trades in a #trading channel. I would pin the link and post it when someone asks how to swap safely."
        />
      </Field>

      {/* Asked here rather than at the first payout.
          It is the question a prospective promoter has and currently cannot
          find an answer to, and choosing a method while applying quietly makes
          the earnings feel real — a commitment device that costs nothing. */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">How would you like to be paid?</legend>

        <div className="space-y-2">
          {PAYOUT_METHODS.map((option) => (
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
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            You can change this any time before a payout goes out. Everything is in US dollars, and
            we cover the cost of sending.
          </p>
        )}
      </fieldset>

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

      <Button type="submit" loading={pending} disabled={pending} block size="md">
        {pending ? "Sending…" : "Apply to promote"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
        A promoter account shares a code and collects earnings. It cannot open or join a swap — if
        you want to trade accounts too, ask someone for their code and register normally.
      </p>
    </form>
  );
}
