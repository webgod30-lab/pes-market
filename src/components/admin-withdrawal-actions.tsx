"use client";

import { useActionState, useState } from "react";

import {
  markWithdrawalSentAction,
  recordTestTransferAction,
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
  promoterName,
  needsTest = false,
  testSentAt = null,
  testConfirmedAt = null,
}: {
  withdrawalId: string;
  amountLabel: string;
  promoterName: string;
  /** First payout, test not yet confirmed. The balance is blocked until it is. */
  needsTest?: boolean;
  testSentAt?: Date | null;
  testConfirmedAt?: Date | null;
}) {
  const [mode, setMode] = useState<"idle" | "send" | "refuse" | "test">("idle");

  if (mode === "test") {
    return <TestForm withdrawalId={withdrawalId} promoterName={promoterName} onCancel={() => setMode("idle")} />;
  }

  if (mode === "send") {
    return <SendForm withdrawalId={withdrawalId} amountLabel={amountLabel} promoterName={promoterName} onCancel={() => setMode("idle")} />;
  }

  if (mode === "refuse") {
    return <RefuseForm withdrawalId={withdrawalId} onCancel={() => setMode("idle")} />;
  }

  return (
    <div className="mt-3">
      {/* The first payout goes in two steps. The full amount cannot be sent
          until the promoter has said the $1 arrived — enforced in the server
          action too, so this is a prompt rather than the control. */}
      {needsTest ? (
        <div className="mb-3 rounded-[var(--radius-control)] border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] p-3">
          <p className="text-xs font-medium text-[var(--tone-warning)]">
            First payout — send the $1 test first
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            {testSentAt
              ? `Test sent ${testSentAt.toLocaleString("en-GB")}. Waiting for ${promoterName} to confirm it arrived — the balance cannot go until they do.`
              : "A wrong address cannot be undone, and they will not accept that it was their own mistake. Send $1, wait for them to confirm, then send the rest."}
          </p>
        </div>
      ) : testConfirmedAt ? (
        <p className="mb-3 text-xs text-[var(--tone-success)]">
          Test confirmed {testConfirmedAt.toLocaleString("en-GB")} — safe to send the balance.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {needsTest && !testSentAt ? (
          <Button type="button" onClick={() => setMode("test")} size="sm">
            Record the $1 test
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setMode("send")}
            size="sm"
            disabled={needsTest}
            title={needsTest ? "Waiting on their confirmation of the test" : undefined}
          >
            I have sent this
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => setMode("refuse")} size="sm">
          Refuse
        </Button>
      </div>
    </div>
  );
}

function TestForm({
  withdrawalId,
  promoterName,
  onCancel,
}: {
  withdrawalId: string;
  promoterName: string;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(recordTestTransferAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <FormError message={state?.message} />
      <input type="hidden" name="withdrawalId" value={withdrawalId} />

      <p className="text-sm text-[var(--muted)]">
        Send $1 to the address above, then paste the hash or reference here.{" "}
        {promoterName} is shown it and asked to confirm it arrived.
      </p>

      <Field label="Test transaction hash or reference" name="reference">
        <input
          id="reference"
          name="reference"
          required
          autoComplete="off"
          className={`${inputClassName} font-mono text-xs`}
          placeholder="0x…"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} disabled={pending} size="sm">
          {pending ? "Recording…" : "Record the test"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SendForm({
  withdrawalId,
  amountLabel,
  promoterName,
  onCancel,
}: {
  withdrawalId: string;
  amountLabel: string;
  promoterName: string;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(markWithdrawalSentAction, undefined);

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
      <FormError message={state?.message} />
      <input type="hidden" name="withdrawalId" value={withdrawalId} />

      <p className="text-xs text-[var(--muted)]">
        Send {amountLabel} to {promoterName} using the details above, then record the reference here.
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
