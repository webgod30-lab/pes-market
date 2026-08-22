"use client";


import { useActionState, useState } from "react";

import {
  requestWithdrawalAction,
  cancelWithdrawalAction,
  confirmTestTransferAction,
} from "@/app/actions/wallet-actions";
import { formatCents } from "@/lib/money";
import { Button, Field, FormError, inputClassName } from "@/components/ui";
import { WITHDRAW_FORM } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";

type Method = "crypto" | "card" | "gift_card" | "bank_transfer";

export function WithdrawForm({
  availableCents,
  minimumCents,
  currency,
  preferredMethod,
  locale = "en",
}: {
  availableCents: number;
  minimumCents: number;
  currency: string;
  /** What they chose when they applied. A default, not a commitment. */
  preferredMethod?: Method | null;
  locale?: Locale;
}) {
  const [state, formAction, pending] = useActionState(requestWithdrawalAction, undefined);
  const [method, setMethod] = useState<Method>(preferredMethod ?? "crypto");
  const copy = WITHDRAW_FORM[locale];

  const METHODS: { value: Method; label: string }[] = [
    { value: "crypto", label: copy.methodCrypto },
    { value: "card", label: copy.methodCard },
    { value: "gift_card", label: copy.methodGiftCard },
    { value: "bank_transfer", label: copy.methodBankTransfer },
  ];

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
      <p className="text-sm text-[var(--muted)]">{copy.belowMinimum(formatCents(minimumCents, currency))}</p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />

      <Field
        label={copy.howMuch}
        name="amount"
        error={state?.fieldErrors?.amountCents}
        hint={copy.upTo(formatCents(availableCents, currency))}
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
        <legend className="mb-1.5 block text-sm font-medium">{copy.howYouWantIt}</legend>
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
            label={copy.walletAddress}
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
            label={copy.network}
            name="destinationNetwork"
            error={state?.fieldErrors?.destinationNetwork}
            hint={copy.networkHint}
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
            label={copy.ibanOrAccount}
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

          <Field label={copy.bank} name="destinationBank" error={state?.fieldErrors?.destinationBank}>
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
            label={copy.swiftBic}
            name="destinationBic"
            error={state?.fieldErrors?.destinationBic}
            hint={copy.swiftBicHint}
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
            label={copy.service}
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
            label={copy.emailOrHandle}
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
            label={copy.whichCard}
            name="destinationProvider"
            error={state?.fieldErrors?.destinationProvider}
            hint={copy.whichCardHint}
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
            label={copy.whereToSend}
            name="destinationAccount"
            error={state?.fieldErrors?.destinationAccount}
            hint={copy.whereToSendHint}
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
        label={method === "crypto" ? copy.walletAddressAgain : copy.confirmWhereItGoes}
        name="destinationConfirm"
        error={destinationMismatch ? copy.mismatchError : undefined}
        hint={copy.confirmHint}
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
        label={copy.nameOnAccount}
        name="destinationName"
        error={state?.fieldErrors?.destinationName}
        hint={copy.nameOnAccountHint}
      >
        <input
          id="destinationName"
          name="destinationName"
          required
          defaultValue={state?.values?.destinationName ?? ""}
          className={inputClassName}
          placeholder={copy.namePlaceholder}
        />
      </Field>

      <Button type="submit" disabled={pending || destinationMismatch || destinationAgain === ""}>
        {pending ? copy.requesting : copy.requestPayout}
      </Button>

      <p className="text-xs text-[var(--muted)]">{copy.checkTwice}</p>
    </form>
  );
}

/** Pulls a request back while it is still waiting. */
export function CancelWithdrawalButton({
  withdrawalId,
  locale = "en",
}: {
  withdrawalId: string;
  locale?: Locale;
}) {
  const [state, formAction, pending] = useActionState(cancelWithdrawalAction, undefined);
  const copy = WITHDRAW_FORM[locale];

  return (
    <form action={formAction} className="mt-2">
      <FormError message={state?.message} />
      <input type="hidden" name="withdrawalId" value={withdrawalId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-[var(--tone-danger)] hover:underline disabled:opacity-60"
      >
        {pending ? copy.cancelling : copy.cancelRequest}
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
  locale = "en",
}: {
  withdrawalId: string;
  reference: string | null;
  locale?: Locale;
}) {
  const [state, formAction, pending] = useActionState(confirmTestTransferAction, undefined);
  const copy = WITHDRAW_FORM[locale];

  if (state?.success) {
    return <p className="mt-2 text-xs text-[var(--tone-success)]">{state.success}</p>;
  }

  return (
    <form action={formAction} className="mt-3 rounded-[var(--radius-control)] border border-[var(--tone-info-border)] bg-[var(--tone-info-bg)] p-3">
      <FormError message={state?.message} />
      <input type="hidden" name="withdrawalId" value={withdrawalId} />

      <p className="text-xs font-medium text-[var(--tone-info)]">{copy.testSentTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{copy.testSentBody}</p>

      {reference ? (
        <p className="mt-2 break-all font-mono text-[0.6875rem] text-[var(--muted)]">{reference}</p>
      ) : null}

      <Button type="submit" size="sm" loading={pending} disabled={pending} className="mt-2.5">
        {pending ? copy.confirming : copy.yesArrived}
      </Button>
    </form>
  );
}
