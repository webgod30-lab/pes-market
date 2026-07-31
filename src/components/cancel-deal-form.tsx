"use client";

import { useActionState } from "react";

import { cancelDealAction } from "@/app/actions/deal-actions";
import { Button, FormError } from "@/components/ui";

export function CancelDealForm({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(cancelDealAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel this deal"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        Only possible before any payment. Afterwards it becomes a dispute.
      </p>
    </form>
  );
}
