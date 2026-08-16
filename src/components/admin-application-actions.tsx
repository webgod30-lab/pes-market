"use client";

import { useActionState, useState } from "react";

import {
  approveApplicationAction,
  rejectApplicationAction,
} from "@/app/actions/promoter-actions";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

/**
 * Let them in, or turn them away.
 *
 * Both are behind a second click, for opposite reasons. Approving creates an
 * account that can sign in and start earning; refusing destroys the password
 * they submitted, so a mis-click means asking them to apply again.
 */
export function ApplicationDecision({
  applicationId,
  displayName,
}: {
  applicationId: string;
  displayName: string;
}) {
  const [mode, setMode] = useState<"idle" | "approve" | "refuse">("idle");

  if (mode === "approve") {
    return (
      <ApproveForm
        applicationId={applicationId}
        displayName={displayName}
        onCancel={() => setMode("idle")}
      />
    );
  }

  if (mode === "refuse") {
    return <RefuseForm applicationId={applicationId} onCancel={() => setMode("idle")} />;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button type="button" onClick={() => setMode("approve")} size="sm">
        Approve
      </Button>
      <Button type="button" variant="secondary" onClick={() => setMode("refuse")} size="sm">
        Refuse
      </Button>
    </div>
  );
}

function ApproveForm({
  applicationId,
  displayName,
  onCancel,
}: {
  applicationId: string;
  displayName: string;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(approveApplicationAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <FormError message={state?.message} />
      <input type="hidden" name="applicationId" value={applicationId} />

      <p className="text-sm text-[var(--muted)]">
        Creates a promoter account for{" "}
        <strong className="text-[var(--foreground)]">{displayName}</strong> with a code of their own.
        They sign in with the password they applied with. They will not be able to open or join a
        swap.
      </p>

      <Field label="Note (optional)" name="note">
        <input
          id="note"
          name="note"
          className={inputClassName}
          placeholder="Runs the 4k eFootball Discord"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} disabled={pending} size="sm">
          {pending ? "Approving…" : "Approve and create the account"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RefuseForm({
  applicationId,
  onCancel,
}: {
  applicationId: string;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(rejectApplicationAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <FormError message={state?.message} />
      <input type="hidden" name="applicationId" value={applicationId} />

      <Field label="Reason" name="reason">
        <input
          id="reason"
          name="reason"
          required
          className={inputClassName}
          placeholder="No audience described"
        />
      </Field>

      <p className="text-xs text-[var(--muted)]">
        Kept with the application. Refusing also deletes the password they submitted — if you change
        your mind they will have to apply again.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" loading={pending} disabled={pending} size="sm">
          {pending ? "Refusing…" : "Refuse"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
