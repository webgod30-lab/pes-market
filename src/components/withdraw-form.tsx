"use client";

import { useActionState, useState } from "react";

import { requestWithdrawalAction, cancelWithdrawalAction } from "@/app/actions/wallet-actions";
import { formatCents } from "@/lib/money";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

const METHODS = [
  { value: "crypto", label: "Crypto" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card / wallet" },
] as const;

type Method = (typeof METHODS)[number]["value"];

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
  const [method, setMethod] = useState<Method>("crypto");

  const belowMinimum = availableCents < minimumCents;

  if (belowMinimum) {
    return (
      <p className="text-sm text-[var(--muted)]">
        You can withdraw once your balance reaches {formatCents(minimumCents, currency)}. Anything
        smaller costs more in transfer fees than it is worth.
      </p>
    );
  }

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

      {/* One field per thing, rather than a single box everything gets pasted
          into. The admin reads these while typing a transfer, and a network
          buried at the end of an address line is a network that gets missed —
          on most chains that loses the money outright. */}
      {method === "crypto" ? (
        <>
          <Field
            label="Wallet address"
            name="destinationAccount"
            error={state?.fieldErrors?.destinationAccount}
          >
            <input
              id="destinationAccount"
              name="destinationAccount"
              required
              autoComplete="off"
              spellCheck={false}
              defaultValue={state?.values?.destinationAccount ?? ""}
              className={`${inputClassName} font-mono`}
              placeholder="TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"
            />
          </Field>

          <Field
            label="Network"
            name="destinationNetwork"
            error={state?.fieldErrors?.destinationNetwork}
            hint="TRC-20, ERC-20, BEP-20… the same address on the wrong network loses the money."
          >
            <input
              id="destinationNetwork"
              name="destinationNetwork"
              required
              defaultValue={state?.values?.destinationNetwork ?? ""}
              className={inputClassName}
              placeholder="USDT (TRC-20)"
            />
          </Field>
        </>
      ) : null}

      {method === "bank_transfer" ? (
        <>
          <Field
            label="IBAN or account number"
            name="destinationAccount"
            error={state?.fieldErrors?.destinationAccount}
          >
            <input
              id="destinationAccount"
              name="destinationAccount"
              required
              autoComplete="off"
              spellCheck={false}
              defaultValue={state?.values?.destinationAccount ?? ""}
              className={`${inputClassName} font-mono`}
              placeholder="AE07 0331 2345 6789 0123 456"
            />
          </Field>

          <Field label="Bank" name="destinationBank" error={state?.fieldErrors?.destinationBank}>
            <input
              id="destinationBank"
              name="destinationBank"
              required
              defaultValue={state?.values?.destinationBank ?? ""}
              className={inputClassName}
              placeholder="Emirates NBD"
            />
          </Field>

          <Field
            label="SWIFT / BIC"
            name="destinationBic"
            error={state?.fieldErrors?.destinationBic}
            hint="Only needed for international transfers. Leave it blank if you do not have one."
          >
            <input
              id="destinationBic"
              name="destinationBic"
              autoComplete="off"
              spellCheck={false}
              defaultValue={state?.values?.destinationBic ?? ""}
              className={`${inputClassName} font-mono`}
              placeholder="EBILAEAD"
            />
          </Field>
        </>
      ) : null}

      {method === "card" ? (
        <>
          <Field
            label="Service"
            name="destinationProvider"
            error={state?.fieldErrors?.destinationProvider}
          >
            <input
              id="destinationProvider"
              name="destinationProvider"
              required
              defaultValue={state?.values?.destinationProvider ?? ""}
              className={inputClassName}
              placeholder="PayPal, Wise, Payoneer"
            />
          </Field>

          <Field
            label="Email or handle on the account"
            name="destinationAccount"
            error={state?.fieldErrors?.destinationAccount}
          >
            <input
              id="destinationAccount"
              name="destinationAccount"
              required
              autoComplete="off"
              spellCheck={false}
              defaultValue={state?.values?.destinationAccount ?? ""}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </Field>
        </>
      ) : null}

      <Field
        label="Name on the account"
        name="destinationName"
        error={state?.fieldErrors?.destinationName}
        hint="Banks and most wallets refuse a transfer where the name does not match."
      >
        <input
          id="destinationName"
          name="destinationName"
          required
          defaultValue={state?.values?.destinationName ?? ""}
          className={inputClassName}
          placeholder="As it appears on the account"
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
