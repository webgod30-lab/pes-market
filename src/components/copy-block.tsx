"use client";

import { Button, toast } from "@/components/ui";
import type { Locale } from "@/lib/locale";
import { SHARE } from "@/lib/promoter-copy";

/**
 * A block of text with a button that copies all of it.
 *
 * The whole point of the promoter kit is that a promoter's effort should be
 * pasting, not writing. Text they have to select by hand — across a phone
 * screen, without catching the surrounding chrome — is text most of them will
 * rewrite badly instead, and then the service gets explained wrong.
 *
 * `dir="auto"` on the block rather than an inherited direction: the text inside
 * is whichever language the promoter is going to paste, and it contains a URL
 * either way. Letting the browser decide from the first strong character gets
 * both the Arabic and the link right without a second prop.
 */
export function CopyBlock({
  text,
  label = "Copy",
  locale = "en",
  className = "",
}: {
  text: string;
  label?: string;
  locale?: Locale;
  className?: string;
}) {
  const copy_ = SHARE[locale];

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast(copy_.copied);
    } catch {
      // Clipboard access can be refused (insecure origin, permissions). The
      // text is on screen to copy by hand, so say so rather than fail silently.
      toast(copy_.copyFailed, "danger");
    }
  }

  return (
    <div className={className}>
      <pre
        dir="auto"
        className="max-h-[28rem] overflow-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-xs leading-relaxed whitespace-pre-wrap break-words"
      >
        {text}
      </pre>
      <Button type="button" onClick={copy} size="sm" className="mt-2">
        {label}
      </Button>
    </div>
  );
}
