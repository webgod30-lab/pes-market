"use client";

import { useActionState, useState } from "react";

import { banUserAction, unbanUserAction } from "@/app/actions/admin-actions";
import { Alert, Button, Field, FormError, Input } from "@/components/ui";

/**
 * Banning takes a reason and a second click. It signs someone out of a service
 * that is holding their money, so it should not be a single unlabelled button.
 */
export function BanUserForm({
  userId,
  displayName,
  openDeals,
}: {
  userId: string;
  displayName: string;
  openDeals: number;
}) {
  const [state, formAction, pending] = useActionState(banUserAction, undefined);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
        Ban
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-2">
      <FormError message={state?.message} />
      <input type="hidden" name="userId" value={userId} />

      {openDeals > 0 ? (
        <Alert tone="warning" className="text-xs">
          {displayName} has {openDeals} deal{openDeals === 1 ? "" : "s"} still in progress. Banning
          does not resolve them — settle or refund those first, or the other party is left waiting.
        </Alert>
      ) : null}

      <Field label="Reason for the ban" name="reason" error={state?.fieldErrors?.reason}>
        <Input
          id="reason"
          name="reason"
          required
          maxLength={500}
          defaultValue={state?.values?.reason ?? ""}
          placeholder={`Why is ${displayName} being banned?`}
        />
      </Field>
      {state?.fieldErrors?.reason ? (
        <p className="text-xs text-[var(--tone-danger)]">{state.fieldErrors.reason}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? "Banning…" : `Ban ${displayName}`}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function UnbanUserForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(unbanUserAction, undefined);

  return (
    <form action={formAction}>
      <FormError message={state?.message} />
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "…" : "Unban"}
      </Button>
    </form>
  );
}
