"use client";

import { useActionState, useEffect, useRef } from "react";

import { markMessagesReadAction, postMessageAction } from "@/app/actions/trust-actions";
import type { ChatMessage } from "@/lib/messages";
import { Button, Field, FormError, Textarea } from "@/components/ui";

/**
 * The conversation for one deal.
 *
 * Admin notes are rendered differently and are only ever present when the admin
 * is reading — they are excluded by the query for everyone else, not merely
 * hidden here.
 */
export function DealChat({
  dealId,
  messages,
  canPostAdminNote = false,
}: {
  dealId: string;
  messages: ChatMessage[];
  canPostAdminNote?: boolean;
}) {
  const [state, formAction, pending] = useActionState(postMessageAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Opening the conversation is what clears the unread badge. Done here rather
  // than during page render, because a GET should not write.
  useEffect(() => {
    void markMessagesReadAction(dealId);
  }, [dealId]);

  // Clear the box after a successful post, so the message isn't left sitting
  // there looking unsent.
  useEffect(() => {
    if (!pending && state && !state.message && !state.fieldErrors) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <div>
      {messages.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No messages yet. Anything agreed here is visible to the admin if this becomes a dispute.
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`rounded-lg border p-3 ${
                message.isAdminNote
                  ? "border-amber-500/30 bg-amber-500/5"
                  : message.mine
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[var(--border)] bg-[var(--surface-2)]"
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">
                  {message.mine ? "You" : message.sender.displayName}
                </span>
                {message.sender.role === "admin" ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-[var(--tone-warning)]">
                    admin
                  </span>
                ) : null}
                {message.isAdminNote ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-[var(--tone-warning)]">
                    internal note — not shown to buyer or seller
                  </span>
                ) : null}
                <span className="text-[var(--muted)]">
                  {message.createdAt.toLocaleString("en-GB")}
                </span>
              </div>
              <p className="whitespace-pre-line text-sm">{message.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="mt-4 space-y-2">
        <FormError message={state?.message} />
        <input type="hidden" name="dealId" value={dealId} />
        <Field label="Message" name="body" error={state?.fieldErrors?.body}>
          <Textarea
            id="body"
            name="body"
            rows={3}
            required
            maxLength={4000}
            placeholder="Write a message…"
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {canPostAdminNote ? (
            <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <input type="checkbox" name="isAdminNote" className="accent-amber-500" />
              Internal note (only you can see it)
            </label>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
