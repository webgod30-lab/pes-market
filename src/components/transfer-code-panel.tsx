"use client";

import { useActionState, useState } from "react";

import {
  provideTransferCodeAction,
  requestTransferCodeAction,
} from "@/app/actions/transfer-code-actions";
import type { TransferCodeView } from "@/lib/transfer-codes";
import { Alert, Button, Field, FormError, inputClassName } from "@/components/ui";

/**
 * The publisher verification code exchange, shown during the claim.
 *
 * Written so that whoever is currently blocked sees an action and the other
 * side sees why they are waiting — the commonest failure here is a seller who
 * does not realise the buyer is stuck on them.
 */
export function TransferCodePanel({
  dealId,
  codes,
  role,
}: {
  dealId: string;
  codes: TransferCodeView[];
  role: "seller" | "buyer" | "admin";
}) {
  const pending = codes.find((c) => c.providedAt === null);

  return (
    <div className="space-y-4">
      {role === "buyer" ? <BuyerSide dealId={dealId} pending={Boolean(pending)} /> : null}

      {/* The seller always gets a form. Originally this only appeared once the
          buyer had raised a request, which meant a seller staring at a code in
          their inbox had no way to hand it over and was told "nothing waiting
          on you" instead. */}
      {role === "seller" ? (
        <SellerSide
          dealId={dealId}
          requestId={pending?.id ?? null}
          note={pending?.requestNote ?? null}
        />
      ) : null}

      {role === "admin" && pending ? (
        <Alert tone="warning">
          The buyer is waiting on the seller for a code. This is the usual reason a claim stalls.
        </Alert>
      ) : null}

      {codes.length > 0 ? (
        <ul className="space-y-2">
          {codes.map((entry) => (
            <li
              key={entry.id}
              className={`rounded-lg border p-3 ${
                entry.code
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span>
                  {entry.unprompted
                    ? `${entry.requestedByName} sent this`
                    : `${entry.requestedByName} asked`}{" "}
                  · {entry.requestedAt.toLocaleString("en-GB")}
                </span>
                {entry.providedAt ? (
                  <span className="text-[var(--tone-success)]">
                    answered {entry.providedAt.toLocaleString("en-GB")}
                  </span>
                ) : (
                  <span className="text-[var(--tone-warning)]">waiting on the seller</span>
                )}
              </div>

              {entry.requestNote ? (
                <p className="mt-1.5 text-sm">{entry.requestNote}</p>
              ) : null}

              {entry.code ? <CodeValue code={entry.code} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** The code itself, with a copy button — it gets typed into Konami under time pressure. */
function CodeValue({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <code className="rounded-md bg-[var(--surface-2)] px-3 py-1.5 font-mono text-lg tracking-widest">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--border)]"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function BuyerSide({ dealId, pending }: { dealId: string; pending: boolean }) {
  const [state, formAction, isPending] = useActionState(requestTransferCodeAction, undefined);

  if (pending) {
    return (
      <Alert tone="warning">
        Waiting on the seller to send the code. If they go quiet, open a dispute — your money is still
        held and has not gone anywhere.
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />

      <Field
        label="Stuck on a verification code?"
        name="note"
        error={state?.fieldErrors?.note}
        hint="Konami sends it to the email still on the account — the seller's. Say what you are seeing."
      >
        <input
          id="note"
          name="note"
          maxLength={300}
          className={inputClassName}
          placeholder="Konami is asking for a code sent to the account email"
        />
      </Field>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Asking…" : "Ask the seller for the code"}
      </Button>
    </form>
  );
}

function SellerSide({
  dealId,
  requestId,
  note,
}: {
  dealId: string;
  /** Null when nobody has asked — the seller is sending it unprompted. */
  requestId: string | null;
  note: string | null;
}) {
  const [state, formAction, isPending] = useActionState(provideTransferCodeAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state?.message} />
      <input type="hidden" name="dealId" value={dealId} />
      {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}

      {requestId ? (
        <Alert tone="warning" title="The buyer is waiting on you."> Konami has sent a verification code to the
          email that is still on the account — your inbox. Paste it below.
          {note ? <p className="mt-1.5 opacity-80">&ldquo;{note}&rdquo;</p> : null}
        </Alert>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          Konami sends the transfer code to the email still on the account — yours. When one arrives,
          paste it here straight away. You do not have to wait for the buyer to ask, and it is faster
          if you do not.
        </p>
      )}

      <Field
        label="Code from Konami"
        name="code"
        error={state?.fieldErrors?.code}
        hint="These expire quickly, so send it as soon as it arrives."
      >
        <input
          id="code"
          name="code"
          required
          autoComplete="off"
          maxLength={64}
          className={`${inputClassName} font-mono tracking-widest`}
          placeholder="123456"
        />
      </Field>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Send the code to the buyer"}
      </Button>

      <p className="text-xs text-[var(--muted)]">
        You are not paid until the buyer confirms they have the account, and they cannot confirm
        without these. Konami often sends more than one, so keep checking your inbox until they are
        through.
      </p>
    </form>
  );
}
