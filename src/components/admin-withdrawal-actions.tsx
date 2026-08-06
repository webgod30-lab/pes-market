"use client";

import { useActionState, useState } from "react";

import {
  markWithdrawalSentAction,
  rejectWithdrawalAction,
} from "@/app/actions/wallet-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

/**
 * Send or refuse, on one row.
 *
 * Both are behind a deliberate second click. "Sent" is the irreversible one —
 * it is the record that money left, and correcting it afterwards means editing
 * the database by hand.
 */
export function WithdrawalDecision({
  withdrawalId,
  amountLabel,
  sellerName,
}: {
  withdrawalId: string;
  amountLabel: string;
  sellerName: string;
}) {
  const [mode, setMode] = useState<"idle" | "send" | "refuse">("idle");

  if (mode === "send") {
    return <SendForm withdrawalId={withdrawalId} amountLabel={amountLabel} sellerName={sellerName} onCancel={() => setMode("idle")} />;
  }

  if (mode === "refuse") {
    return <RefuseForm withdrawalId={withdrawalId} onCancel={() => setMode("idle")} />;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button type="button" onClick={() => setMode("send")} size="sm">
        I have sent this
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setMode("refuse")}
        size="sm"
      >
        Refuse
      </Button>
    </div>
  );
}

function SendForm({
  withdrawalId,
  amountLabel,
  sellerName,
  onCancel,
}: {
  withdrawalId: string;
  amountLabel: string;
  sellerName: string;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(markWithdrawalSentAction, undefined);

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
      <FormError message={state?.message} />
      <input type="hidden" name="withdrawalId" value={withdrawalId} />

      <p className="text-xs text-[var(--muted)]">
        Send {amountLabel} to {sellerName} using the details above, then record the reference here.
        Marking it sent does not move any money — it records that you did.
      </p>

      <Field
        label="Transfer reference"
        name="reference"
        error={state?.fieldErrors?.reference}
        hint="Transaction hash, bank reference, whatever proves it went."
      >
        <input
          id="reference"
          name="reference"
          required
          className={`${inputClassName} font-mono`}
          placeholder="0x… or bank reference"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Recording…" : "Confirm sent"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} size="sm">
          Not yet
        </Button>
      </div>
    </form>
  );
}

function RefuseForm({
  withdrawalId,
  onCancel,
}: {
  withdrawalId: string;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(rejectWithdrawalAction, undefined);

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
      <FormError message={state?.message} />
      <input type="hidden" name="withdrawalId" value={withdrawalId} />

      <Field
        label="Why"
        name="reason"
        error={state?.fieldErrors?.reason}
        hint="The seller is shown this. The money goes straight back to their balance."
      >
        <input
          id="reason"
          name="reason"
          required
          className={inputClassName}
          placeholder="Destination address looks wrong — send it again with the network"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" disabled={pending} size="sm">
          {pending ? "Refusing…" : "Refuse and return the funds"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} size="sm">
          Cancel
        </Button>
      </div>
    </form>
  );
}
