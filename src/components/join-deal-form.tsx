"use client";

import { useActionState } from "react";

import { joinDealAction } from "@/app/actions/deal-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";
import { JOIN_DEAL_FORM } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";

export function JoinDealForm({
  defaultCode = "",
  locale = "en",
}: {
  defaultCode?: string;
  locale?: Locale;
}) {
  const [state, formAction, pending] = useActionState(joinDealAction, undefined);
  const copy = JOIN_DEAL_FORM[locale];

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />

      <Field
        label={copy.inviteCodeLabel}
        name="inviteCode"
        error={state?.fieldErrors?.inviteCode}
        hint={copy.inviteCodeHint}
      >
        <input
          id="inviteCode"
          name="inviteCode"
          required
          defaultValue={state?.values?.inviteCode ?? defaultCode}
          aria-invalid={Boolean(state?.fieldErrors?.inviteCode)}
          className={`${inputClassName} font-mono`}
          placeholder={copy.inviteCodePlaceholder}
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? copy.joining : copy.join}
      </Button>
    </form>
  );
}
