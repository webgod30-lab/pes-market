"use client";

import { useActionState } from "react";

import { confirmClaimedAction } from "@/app/actions/payment-actions";
import { PublisherWarningLine } from "@/components/publisher-warning";
import { Button, FormError } from "@/components/ui";

/**
 * The last step, for either party.
 *
 * The old copy said this "releases the money to the seller". There is no money:
 * a swap trades one account for another, and what this actually does is close
 * your half of it. Both sides press it, and the deal only completes on the
 * second.
 *
 * The publisher warning sits here rather than only on the marketing pages
 * because this is the moment of commitment — the point at which somebody has
 * an account they did not have before and is about to accept it. A panel would
 * be read as chrome and skipped; one line above the button is read.
 */
export function ConfirmClaimForm({ dealId }: { dealId: string }) {
  const [state, formAction, pending] = useActionState(confirmClaimedAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Confirming…" : "I have claimed the account — confirm the swap"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        Only press this once you have changed the email and password and you are sure the account is
        yours. The swap closes once both of you have confirmed.
      </p>
      <PublisherWarningLine />
    </form>
  );
}
