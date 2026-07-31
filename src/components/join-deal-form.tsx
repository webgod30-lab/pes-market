"use client";

import { useActionState } from "react";

import { joinDealAction } from "@/app/actions/deal-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

export function JoinDealForm({ defaultCode = "" }: { defaultCode?: string }) {
  const [state, formAction, pending] = useActionState(joinDealAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />

      <Field
        label="Invite code"
        name="inviteCode"
        error={state?.fieldErrors?.inviteCode}
        hint="The other person gets this when they open the deal."
      >
        <input
          id="inviteCode"
          name="inviteCode"
          required
          defaultValue={state?.values?.inviteCode ?? defaultCode}
          aria-invalid={Boolean(state?.fieldErrors?.inviteCode)}
          className={`${inputClassName} font-mono`}
          placeholder="Paste the code here"
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Joining…" : "Join this deal"}
      </Button>
    </form>
  );
}
