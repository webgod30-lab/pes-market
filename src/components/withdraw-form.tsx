"use client";


import { useActionState, useState } from "react";

import {
  requestWithdrawalAction,
  cancelWithdrawalAction,
  confirmTestTransferAction,
} from "@/app/actions/wallet-actions";
import { formatCents } from "@/lib/money";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

const METHODS = [
  { value: "crypto", label: "Crypto" },
  { value: "card", label: "PayPal / wallet" },
  { value: "gift_card", label: "Gift card" },
  { value: "bank_transfer", label: "Bank transfer" },
] as const;

type Method = (typeof METHODS)[number]["value"];

export function WithdrawForm({
  availableCents,
  minimumCents,
  currency,
  preferredMethod,
}: {
  availableCents: number;
  minimumCents: number;
  currency: string;
  /** What they chose when they applied. A default, not a commitment. */
  preferredMethod?: Method | null;
}) {
  const [state, formAction, pending] = useActionState(requestWithdrawalAction, undefined);
  const [method, setMethod] = useState<Method>(preferredMethod ?? "crypto");

  // Typed twice, and they have to match.
  //
  // A crypto transfer to a wrong address is gone permanently, and one wrong
  // character does it. The $1 test catches it too, but this catches it before
  // anybody spends a dollar and a day finding out.
  const [destination, setDestination] = useState("");
  const [destinationAgain, setDestinationAgain] = useState("");
  const destinationMismatch =
    destinationAgain.length > 0 && destination.trim() !== destinationAgain.trim();

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
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
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
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
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
              defaultValue={state?.values?.destinationProvider ?? "PayPal"}
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
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </Field>
        </>
      ) : null}

      {method === "gift_card" ? (
        <>
          <Field
            label="Which card"
            name="destinationProvider"
            error={state?.fieldErrors?.destinationProvider}
            hint="Steam, Amazon or Google Play."
          >
            <input
              id="destinationProvider"
              name="destinationProvider"
              required
              defaultValue={state?.values?.destinationProvider ?? ""}
              className={inputClassName}
              placeholder="Steam"
            />
          </Field>

          <Field
            label="Where to send the code"
            name="destinationAccount"
            error={state?.fieldErrors?.destinationAccount}
            hint="An email address. Nothing is charged to it — the code is just sent there."
          >
            <input
              id="destinationAccount"
              name="destinationAccount"
              required
              autoComplete="off"
              spellCheck={false}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </Field>
        </>
      ) : null}

      {/* Typed again, and it has to match.
          One wrong character in a wallet address sends the money somewhere
          nobody can reach, and the person who typed it will be certain they
          typed it correctly. Re-entry is the cheapest place to catch that. */}
      <Field
        label={method === "crypto" ? "Wallet address again" : "Confirm where it goes"}
        name="destinationConfirm"
        error={destinationMismatch ? "These do not match. Check both, character for character." : undefined}
        hint="Paste or type it a second time. We compare the two before submitting."
      >
        <input
          id="destinationConfirm"
          name="destinationConfirm"
          required
          autoComplete="off"
          spellCheck={false}
          value={destinationAgain}
          onChange={(event) => setDestinationAgain(event.target.value)}
          aria-invalid={destinationMismatch || undefined}
          className={`${inputClassName} ${method === "crypto" ? "font-mono" : ""}`}
        />
      </Field>

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

      <Button type="submit" disabled={pending || destinationMismatch || destinationAgain === ""}>
        {pending ? "Requesting…" : "Request payout"}
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

/**
 * The promoter says the $1 test arrived.
 *
 * Only they can. The whole point of the test is that somebody who is not the
 * admin looks at the receiving end and confirms the money is really there —
 * an admin ticking it off themselves would prove nothing.
 */
export function ConfirmTestButton({
  withdrawalId,
  reference,
}: {
  withdrawalId: string;
  reference: string | null;
}) {
  const [state, formAction, pending] = useActionState(confirmTestTransferAction, undefined);

  if (state?.success) {
    return <p className="mt-2 text-xs text-[var(--tone-success)]">{state.success}</p>;
  }

  return (
    <form action={formAction} className="mt-3 rounded-[var(--radius-control)] border border-[var(--tone-info-border)] bg-[var(--tone-info-bg)] p-3">
      <FormError message={state?.message} />
      <input type="hidden" name="withdrawalId" value={withdrawalId} />

      <p className="text-xs font-medium text-[var(--tone-info)]">We sent you a $1 test</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Check it arrived before we send the rest. If it did not, do not confirm — tell us, and we
        will check the address rather than send the balance after it.
      </p>

      {reference ? (
        <p className="mt-2 break-all font-mono text-[0.6875rem] text-[var(--muted)]">{reference}</p>
      ) : null}

      <Button type="submit" size="sm" loading={pending} disabled={pending} className="mt-2.5">
        {pending ? "Confirming…" : "Yes, the $1 arrived"}
      </Button>
    </form>
  );
}
