"use client";

import { useActionState, useState } from "react";

import {
  openDisputeAction,
  resolveDisputeAction,
  withdrawDisputeAction,
} from "@/app/actions/trust-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

/**
 * The emergency brake, kept behind a disclosure so it is not one stray click
 * away — but plainly available, because needing it is exactly when people are
 * panicking.
 */
export function OpenDisputeForm({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(openDisputeAction, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div>
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          Something is wrong — open a dispute
        </Button>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Freezes the deal immediately. Neither the money nor the account moves until the admin
          decides.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />

      <Field label="What is the problem?" name="reason" error={state?.fieldErrors?.reason}>
        <input
          id="reason"
          name="reason"
          required
          maxLength={120}
          defaultValue={state?.values?.reason ?? ""}
          className={inputClassName}
          placeholder="Account credentials do not work"
        />
      </Field>

      <Field
        label="What happened?"
        name="description"
        error={state?.fieldErrors?.description}
        hint="The admin decides from this. Include what you tried and what you saw."
      >
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          defaultValue={state?.values?.description ?? ""}
          className={inputClassName}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Opening…" : "Freeze the deal and open a dispute"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Never mind
        </Button>
      </div>
    </form>
  );
}

export function WithdrawDisputeForm({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(withdrawDisputeAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Withdrawing…" : "Withdraw the dispute"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        Puts the deal back where it was before the freeze.
      </p>
    </form>
  );
}

/** ADMIN. Decide the case. */
export function ResolveDisputeForm({
  dealId,
  buyerName,
  sellerName,
  refundLabel,
  payoutLabel,
}: {
  dealId: string;
  buyerName: string;
  sellerName: string;
  refundLabel: string;
  payoutLabel: string;
}) {
  const [state, formAction, pending] = useActionState(resolveDisputeAction, undefined);
  const [outcome, setOutcome] = useState<string>("");

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Who is right?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 has-checked:border-emerald-500 has-checked:bg-emerald-500/10">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="outcome"
                value="buyer"
                checked={outcome === "buyer"}
                onChange={(event) => setOutcome(event.target.value)}
                className="accent-emerald-500"
              />
              <span className="text-sm font-medium">Refund {buyerName}</span>
            </span>
            <span className="mt-1 block ps-6 text-xs text-[var(--muted)]">
              Send {refundLabel} back to the buyer. The deal ends as refunded.
            </span>
          </label>

          <label className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 has-checked:border-emerald-500 has-checked:bg-emerald-500/10">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="outcome"
                value="seller"
                checked={outcome === "seller"}
                onChange={(event) => setOutcome(event.target.value)}
                className="accent-emerald-500"
              />
              <span className="text-sm font-medium">Pay {sellerName}</span>
            </span>
            <span className="mt-1 block ps-6 text-xs text-[var(--muted)]">
              The deal completes and you owe the seller {payoutLabel}.
            </span>
          </label>
        </div>
        {state?.fieldErrors?.outcome ? (
          <p className="mt-1.5 text-xs text-[var(--tone-danger)]">{state.fieldErrors.outcome}</p>
        ) : null}
      </fieldset>

      <Field
        label="How did you decide?"
        name="resolution"
        error={state?.fieldErrors?.resolution}
        hint="Both parties see this. Say what evidence you went on."
      >
        <textarea id="resolution" name="resolution" rows={4} required className={inputClassName} />
      </Field>

      <Button type="submit" disabled={pending || !outcome}>
        {pending ? "Resolving…" : "Resolve the dispute"}
      </Button>
    </form>
  );
}
