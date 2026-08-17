"use client";

import { useActionState, useState } from "react";

import { purgeDemoDataAction } from "@/app/actions/admin-actions";
import { Alert, Button, Field, FormError, inputClassName } from "@/components/ui";

const PHRASE = "DELETE DEMO DATA";

/**
 * Typed confirmation, not a second button.
 *
 * This deletes accounts and every deal and review attached to them, and there
 * is no undo. A confirm dialog is dismissed by reflex; typing the phrase is not
 * something anyone does by accident.
 */
export function PurgeDemoForm({ accounts, deals }: { accounts: number; deals: number }) {
  const [state, formAction, pending] = useActionState(purgeDemoDataAction, undefined);
  const [typed, setTyped] = useState("");

  if (state?.success) {
    return (
      <Alert tone="success">
        <p className="font-medium">{state.success}</p>
        <p className="mt-1.5 text-sm">
          Reload the reviews page to see what is left. If it is empty, that is the honest number.
        </p>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <FormError message={state?.message} />

      <Field label={`Type ${PHRASE} to confirm`} name="confirm">
        <input
          id="confirm"
          name="confirm"
          required
          autoComplete="off"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          className={`${inputClassName} font-mono`}
          placeholder={PHRASE}
        />
      </Field>

      <Button
        type="submit"
        variant="danger"
        loading={pending}
        disabled={pending || typed !== PHRASE}
        size="sm"
      >
        {pending
          ? "Deleting…"
          : `Delete ${accounts} account${accounts === 1 ? "" : "s"} and ${deals} deal${deals === 1 ? "" : "s"}`}
      </Button>
    </form>
  );
}
