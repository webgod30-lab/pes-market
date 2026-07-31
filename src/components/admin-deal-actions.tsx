"use client";

import { useActionState } from "react";

import {
  approveDeliveryAction,
  confirmPaymentAction,
  markPayoutAction,
  recordVerificationAction,
  refundDealAction,
} from "@/app/actions/admin-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

/** Confirms the money actually arrived. Funds are held from here on. */
export function ConfirmPaymentButton({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(confirmPaymentAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Confirming…" : "Payment received — hold the funds"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        Check the wallet or bank account first. This tells both sides the money is with you.
      </p>
    </form>
  );
}

export function RecordVerificationForm({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(recordVerificationAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Field
        label="What did you check?"
        name="note"
        error={state?.fieldErrors?.note}
        hint="Kept for your records and available if this becomes a dispute."
      >
        <textarea
          id="note"
          name="note"
          rows={3}
          required
          className={inputClassName}
          placeholder="Logged in successfully. Squad matches the description: 4 Legends, rating 3350. No ban notice."
        />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Save verification note"}
      </Button>
    </form>
  );
}

/** The point of no return: the buyer gets the account. */
export function ApproveDeliveryButton({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(approveDeliveryAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Releasing…" : "Approve delivery — release to buyer"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        Only after you have logged in and confirmed the account matches. This cannot be undone; the
        buyer sees the login immediately and the confirmation clock starts.
      </p>
    </form>
  );
}

export function MarkPayoutForm({ dealId, payoutLabel }: { dealId: string; payoutLabel: string }) {
  const [state, formAction, pending] = useActionState(markPayoutAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Field
        label={`Payout reference (${payoutLabel} to the seller)`}
        name="reference"
        error={state?.fieldErrors?.reference}
        hint="Transaction hash or bank reference, so the seller can match it."
      >
        <input id="reference" name="reference" required className={inputClassName} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Mark payout as sent"}
      </Button>
    </form>
  );
}

export function RefundButton({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(refundDealAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Refunding…" : "Refund the buyer"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        Ends the deal and returns the money. Send the refund yourself, then record it here.
      </p>
    </form>
  );
}
