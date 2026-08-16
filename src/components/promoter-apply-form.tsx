"use client";

import { useActionState, useState } from "react";

import { applyToPromoteAction } from "@/app/actions/promoter-actions";
import { AuthFormError } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Alert, Button, Field, fieldDescribedBy, inputClassName } from "@/components/ui";

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
