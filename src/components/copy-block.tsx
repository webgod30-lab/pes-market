"use client";

import { Button, toast } from "@/components/ui";

/**
 * A block of text with a button that copies all of it.
 *
 * The whole point of the promoter kit is that a promoter's effort should be
 * pasting, not writing. Text they have to select by hand — across a phone
 * screen, without catching the surrounding chrome — is text most of them will
 * rewrite badly instead, and then the service gets explained wrong.
 */
export function CopyBlock({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied.");
    } catch {
      // Clipboard access can be refused (insecure origin, permissions). The
      // text is on screen to copy by hand, so say so rather than fail silently.
      toast("Could not reach the clipboard — select the text and copy it by hand.", "danger");
    }
  }

  return (
    <div className={className}>
      <pre className="max-h-[28rem] overflow-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-xs leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </pre>
      <Button type="button" onClick={copy} size="sm" className="mt-2">
        {label}
      </Button>
    </div>
  );
}
