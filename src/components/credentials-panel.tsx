"use client";

import { useActionState, useState } from "react";

import { Button, FormError } from "@/components/ui";
import type { CredentialData } from "@/lib/crypto";

type RevealState = { credentials?: CredentialData; error?: string } | undefined;
type RevealAction = (state: RevealState, formData: FormData) => Promise<RevealState>;

/**
 * Shows account credentials, behind an explicit button press.
 *
 * Deliberately not rendered on page load: the details only travel to the browser
 * when someone entitled to them asks, which keeps them out of the default page
 * payload and out of anything cached along the way.
 */
export function CredentialsPanel({
  dealId,
  action,
  revealLabel,
  note,
}: {
  dealId: string;
  action: RevealAction;
  revealLabel: string;
  note?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const creds = state?.credentials;

  if (!creds) {
    return (
      <form action={formAction} className="space-y-3">
        <FormError message={state?.error} />
        <input type="hidden" name="dealId" value={dealId} />
        <Button type="submit" disabled={pending}>
          {pending ? "Decrypting…" : revealLabel}
        </Button>
        {note ? <p className="text-xs text-[var(--muted)]">{note}</p> : null}
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <SecretRow label="Account login" value={creds.loginEmail} />
      <SecretRow label="Account password" value={creds.loginPassword} secret />
      {creds.recoveryEmail ? <SecretRow label="Recovery email" value={creds.recoveryEmail} /> : null}
      {creds.recoveryEmailPassword ? (
        <SecretRow label="Recovery email password" value={creds.recoveryEmailPassword} secret />
      ) : null}
      {creds.notes ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Notes from the seller</p>
          <p className="mt-1 whitespace-pre-line text-sm">{creds.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

/** One credential field, hidden until asked for, with a copy button. */
function SecretRow({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [shown, setShown] = useState(!secret);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-sm">
          {shown ? value : "•".repeat(Math.min(value.length, 24))}
        </code>
        {secret ? (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--border)]"
          >
            {shown ? "Hide" : "Show"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--border)]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
