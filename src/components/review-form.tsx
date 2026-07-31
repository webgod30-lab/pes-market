"use client";

import { useActionState, useState } from "react";

import { leaveReviewAction } from "@/app/actions/trust-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

export function ReviewForm({
  dealId,
  counterpartyName,
}: {
  dealId: string;
  counterpartyName: string;
}) {
  const [state, formAction, pending] = useActionState(leaveReviewAction, undefined);
  const [rating, setRating] = useState(5);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">How did it go with {counterpartyName}?</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <span
                className={`text-2xl ${value <= rating ? "text-amber-300" : "text-[var(--border)]"}`}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                ★
              </span>
            </label>
          ))}
        </div>
        {state?.fieldErrors?.rating ? (
          <p className="mt-1.5 text-xs text-red-400">{state.fieldErrors.rating}</p>
        ) : null}
      </fieldset>

      <Field
        label="Anything worth saying?"
        name="comment"
        error={state?.fieldErrors?.comment}
        hint="Optional. Other people rely on this when deciding whether to trade with them."
      >
        <textarea id="comment" name="comment" rows={3} className={inputClassName} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Leave review"}
      </Button>
    </form>
  );
}
