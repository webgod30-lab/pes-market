"use client";

import { useActionState } from "react";

import { depositCredentialsAction } from "@/app/actions/deal-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

/**
 * The seller hands the account to escrow.
 *
 * Note there are no `defaultValue`s pulled from server state anywhere here: on
 * a validation failure the action deliberately does not echo these fields back,
 * so account credentials are never re-rendered into the HTML of a response.
 */
export function DepositCredentialsForm({
  dealId,
  alreadyDeposited,
}: {
  dealId: string;
  alreadyDeposited: boolean;
}) {
  const [state, formAction, pending] = useActionState(depositCredentialsAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />

      <input type="hidden" name="dealId" value={dealId} />

      {alreadyDeposited ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-[var(--tone-warning)]">
          Account details are already stored. Submitting again replaces them — only possible until the
          buyer sends payment.
        </p>
      ) : null}

      <Field label="Account login / email" name="loginEmail" error={state?.fieldErrors?.loginEmail}>
        <input
          id="loginEmail"
          name="loginEmail"
          required
          autoComplete="off"
          aria-invalid={Boolean(state?.fieldErrors?.loginEmail)}
          className={inputClassName}
          placeholder="the login for the game account"
        />
      </Field>

      <Field label="Account password" name="loginPassword" error={state?.fieldErrors?.loginPassword}>
        <input
          id="loginPassword"
          name="loginPassword"
          type="password"
          required
          autoComplete="off"
          aria-invalid={Boolean(state?.fieldErrors?.loginPassword)}
          className={inputClassName}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Recovery email"
          name="recoveryEmail"
          error={state?.fieldErrors?.recoveryEmail}
          hint="Optional"
        >
          <input
            id="recoveryEmail"
            name="recoveryEmail"
            autoComplete="off"
            className={inputClassName}
          />
        </Field>

        <Field
          label="Recovery email password"
          name="recoveryEmailPassword"
          error={state?.fieldErrors?.recoveryEmailPassword}
          hint="Optional"
        >
          <input
            id="recoveryEmailPassword"
            name="recoveryEmailPassword"
            type="password"
            autoComplete="off"
            className={inputClassName}
          />
        </Field>
      </div>

      <Field
        label="Anything else the buyer needs"
        name="notes"
        error={state?.fieldErrors?.notes}
        hint="2FA codes, linked console, region, restrictions."
      >
        <textarea id="notes" name="notes" rows={3} className={inputClassName} />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Encrypting and storing…" : "Hand the account to escrow"}
      </Button>

      <p className="text-center text-xs text-[var(--muted)]">
        Encrypted before it is stored. The buyer cannot see any of this until the admin has checked
        the account and approved delivery.
      </p>
    </form>
  );
}
