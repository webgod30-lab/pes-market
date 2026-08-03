"use client";

import { useActionState, useState } from "react";

import { requestWithdrawalAction, cancelWithdrawalAction } from "@/app/actions/wallet-actions";
import { formatCents } from "@/lib/money";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

const METHODS = [
  { value: "crypto", label: "Crypto", hint: "Paste the full address, and say which network." },
  { value: "bank_transfer", label: "Bank transfer", hint: "IBAN or account number, plus the name on the account." },
  { value: "card", label: "Card / wallet", hint: "The details needed to send it, exactly as your provider shows them." },
] as const;

export function WithdrawForm({
  availableCents,
  minimumCents,
  currency,
}: {
  availableCents: number;
  minimumCents: number;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState(requestWithdrawalAction, undefined);
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("crypto");

  const belowMinimum = availableCents < minimumCents;

  if (belowMinimum) {
    return (
      <p className="text-sm text-[var(--muted)]">
        You can withdraw once your balance reaches {formatCents(minimumCents, currency)}. Anything
        smaller costs more in transfer fees than it is worth.
      </p>
    );
  }

  const selected = METHODS.find((m) => m.value === method)!;

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />

      <Field
        label="How much"
        name="amount"
        error={state?.fieldErrors?.amountCents}
        hint={`Up to ${formatCents(availableCents, currency)}.`}
      >
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          required
          defaultValue={state?.values?.amount ?? (availableCents / 100).toFixed(2)}
          className={inputClassName}
          placeholder="50.00"
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium">How you want it</legend>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                method === option.value
                  ? "border-emerald-500/60 bg-emerald-500/10 text-[var(--tone-success)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <input
                type="radio"
                name="method"
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {state?.fieldErrors?.method ? (
          <p className="mt-1.5 text-xs text-[var(--tone-danger)]">{state.fieldErrors.method}</p>
        ) : null}
      </fieldset>

      <Field
        label="Where to send it"
        name="destination"
        error={state?.fieldErrors?.destination}
        hint={selected.hint}
      >
        <textarea
          id="destination"
          name="destination"
          required
          rows={3}
          defaultValue={state?.values?.destination ?? ""}
          className={inputClassName}
          placeholder={
            method === "crypto"
              ? "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE (USDT, TRC-20)"
              : "Account name, number and sort code / IBAN"
          }
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Requesting…" : "Request withdrawal"}
      </Button>

      <p className="text-xs text-[var(--muted)]">
        Check the destination twice. The admin sends exactly what you put here, and a transfer to the
        wrong address cannot be pulled back.
      </p>
    </form>
  );
}

/** Pulls a request back while it is still waiting. */
export function CancelWithdrawalButton({ withdrawalId }: { withdrawalId: string }) {
  const [state, formAction, pending] = useActionState(cancelWithdrawalAction, undefined);

  return (
    <form action={formAction} className="mt-2">
      <FormError message={state?.message} />
      <input type="hidden" name="withdrawalId" value={withdrawalId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-[var(--tone-danger)] hover:underline disabled:opacity-60"
      >
        {pending ? "Cancelling…" : "Cancel this request"}
      </button>
    </form>
  );
}
