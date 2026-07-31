"use client";

import { useActionState, useState } from "react";

import { forceCancelAction, forceRefundAction } from "@/app/actions/admin-actions";
import { Button, FormError } from "@/components/ui";

/**
 * Overrides, behind a confirmation. These reverse a deal the app already
 * considers finished, so they should feel deliberate.
 */
export function ForceRefundForm({ dealId, amountLabel }: { dealId: string; amountLabel: string }) {
  const [state, formAction, pending] = useActionState(forceRefundAction, undefined);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div>
        <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
          Force-refund this completed deal
        </Button>
        <p className="mt-2 text-xs text-[var(--muted)]">
          For when a settled deal turns out not to be — the account gets clawed back afterwards, say.
          Only possible before you have paid the seller.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <p className="text-sm">
        Reverse this deal and return {amountLabel} to the buyer? The seller will not be paid.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Refunding…" : "Yes, force-refund"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function ForceCancelForm({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(forceCancelAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Cancelling…" : "Force-cancel this deal"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        For a deal that has stalled and will never complete. No money has moved, so nothing is
        reversed.
      </p>
    </form>
  );
}
