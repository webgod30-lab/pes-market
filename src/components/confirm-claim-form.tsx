"use client";

import { useActionState } from "react";

import { confirmClaimedAction } from "@/app/actions/payment-actions";
import { Button, FormError } from "@/components/ui";

/**
 * The buyer's final step. Pressing this releases the money to the seller, so it
 * says so plainly rather than hiding behind "Confirm".
 */
export function ConfirmClaimForm({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(confirmClaimedAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Confirming…" : "I have claimed the account — release the money"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        Only press this once you have changed the email and password and you are sure the account is
        yours. It settles the deal and pays the seller.
      </p>
    </form>
  );
}
