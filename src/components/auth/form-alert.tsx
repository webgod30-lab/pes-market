"use client";

import { useEffect, useRef } from "react";

import { FormError } from "@/components/ui";

/**
 * The form-level error, with focus moved to it.
 *
 * `role="alert"` — which FormError already sets — gets the message read out,
 * but it leaves the cursor wherever it was, usually on a submit button at the
 * bottom of a form whose problem is at the top. A sighted keyboard user is told
 * nothing at all. Moving focus fixes both: the message is announced, and the
 * next Tab continues from the error rather than off the end of the form.
 *
 * Only on a *change* to a non-empty message. Focusing on every render would
 * fight the user for the cursor, and re-focusing an unchanged error would steal
 * it back every time the form re-rendered for an unrelated reason. This can only
 * fire after a submission has come back, so it never interrupts typing.
 */
export function AuthFormError({ message }: { message?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (message && message !== previous.current) ref.current?.focus();
    previous.current = message;
  }, [message]);

  if (!message) return null;

  return (
    // tabIndex -1 makes it programmatically focusable without adding a stop to
    // the tab order — the error is a destination, not a control.
    <div ref={ref} tabIndex={-1} className="outline-none">
      <FormError message={message} />
    </div>
  );
}
