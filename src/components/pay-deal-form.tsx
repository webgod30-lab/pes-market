"use client";

import { useActionState, useState } from "react";

import {
  startAutomaticPaymentAction,
  submitPaymentAction,
} from "@/app/actions/payment-actions";
import type { PaymentMethodView } from "@/lib/payment-methods";
import { Alert, Button, Field, FormError, inputClassName } from "@/components/ui";

/**
 * The buyer picks a method, then follows one of two paths:
 *
 *   automatic — a provider confirms the payment and the deal advances on its own
 *   manual     — the buyer tells the admin what they sent, and the admin checks
 *
 * The picker sits outside both forms so the two can be separate: HTML does not
 * allow nesting one form inside another.
 */
export function PayDealForm({
  dealId,
  amountLabel,
  methods,
}: {
  dealId: string;
  amountLabel: string;
  methods: PaymentMethodView[];
}) {
  const [selectedId, setSelectedId] = useState(methods[0]?.id ?? "");
  const selected = methods.find((m) => m.id === selectedId) ?? null;

  if (methods.length === 0) {
    return (
      <Alert tone="warning">
        The admin has not set up any payment methods yet. Nothing to pay to — contact them before
        sending anything.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">How are you paying?</legend>
        <div className="space-y-2">
          {methods.map((method) => (
            <label
              key={method.id}
              className="flex cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 has-checked:border-emerald-500 has-checked:bg-emerald-500/10"
            >
              <input
                type="radio"
                name="methodPicker"
                value={method.id}
                checked={selectedId === method.id}
                onChange={(event) => setSelectedId(event.target.value)}
                className="accent-emerald-500"
              />
              <span className="text-sm font-medium">{method.label}</span>
              {method.network ? (
                <span className="text-xs text-[var(--muted)]">{method.network}</span>
              ) : null}
              {method.isAutomatic ? (
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 text-[10px] text-[var(--tone-info)]">
                  confirmed automatically
                </span>
              ) : null}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Send exactly</p>
        <p className="mt-1 text-2xl font-semibold text-[var(--tone-success)]">{amountLabel}</p>
      </div>

      {selected?.isAutomatic ? (
        <AutomaticPayment dealId={dealId} method={selected} />
      ) : selected ? (
        <ManualPayment dealId={dealId} method={selected} />
      ) : null}
    </div>
  );
}

/** Provider-confirmed. The deal advances when the webhook arrives, not here. */
function AutomaticPayment({ dealId, method }: { dealId: string; method: PaymentMethodView }) {
  const [state, formAction, pending] = useActionState(startAutomaticPaymentAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state?.error} />
      <input type="hidden" name="dealId" value={dealId} />
      <input type="hidden" name="paymentMethodId" value={method.id} />

      <p className="whitespace-pre-line text-xs leading-relaxed text-[var(--muted)]">
        {method.instructions}
      </p>

      {state?.instructions ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="mb-1 text-xs uppercase tracking-wide text-[var(--muted)]">
            Payment started
          </p>
          <pre className="whitespace-pre-wrap font-mono text-xs">{state.instructions}</pre>
          {state.redirectUrl ? (
            <a
              href={state.redirectUrl}
              className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              Continue to the payment page →
            </a>
          ) : null}
          <p className="mt-3 text-xs text-[var(--muted)]">
            This page updates by itself once the payment is confirmed. Nothing else to do.
          </p>
        </div>
      ) : (
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Starting…" : "Pay now"}
        </Button>
      )}
    </form>
  );
}

/** The admin checks the wallet or bank account and confirms by hand. */
function ManualPayment({ dealId, method }: { dealId: string; method: PaymentMethodView }) {
  const [state, formAction, pending] = useActionState(submitPaymentAction, undefined);
  const [copied, setCopied] = useState(false);

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <input type="hidden" name="paymentMethodId" value={method.id} />

      {method.walletAddress ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            To this address{method.network ? ` (${method.network})` : ""}
          </p>
          <p className="mt-1 break-all rounded-md bg-[var(--surface-2)] p-2 font-mono text-xs">
            {method.walletAddress}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={() => copyAddress(method.walletAddress!)}
          >
            {copied ? "Copied" : "Copy address"}
          </Button>
        </div>
      ) : null}

      <p className="whitespace-pre-line text-xs leading-relaxed text-[var(--muted)]">
        {method.instructions}
      </p>

      <Field
        label="Transaction hash"
        name="txHash"
        error={state?.fieldErrors?.txHash}
        hint="For crypto. Paste the hash so the admin can find it on the blockchain."
      >
        <input
          id="txHash"
          name="txHash"
          defaultValue={state?.values?.txHash ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.txHash)}
          className={`${inputClassName} font-mono`}
        />
      </Field>

      <Field
        label="Or a reference"
        name="reference"
        error={state?.fieldErrors?.reference}
        hint="For bank or card. Whatever the admin can match against their statement."
      >
        <input
          id="reference"
          name="reference"
          defaultValue={state?.values?.reference ?? ""}
          className={inputClassName}
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Submitting…" : "I have sent the payment"}
      </Button>

      <p className="text-center text-xs text-[var(--muted)]">
        Only submit this after you have actually sent the money. The admin checks it arrived before
        anything is released.
      </p>
    </form>
  );
}
