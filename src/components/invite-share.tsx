"use client";

import { Button, toast } from "@/components/ui";

/**
 * Shows the invite code and a copyable link for the deal creator.
 *
 * The link origin is read at click time rather than during render: the server
 * does not know the browser's origin, and hardcoding localhost would break the
 * moment this is deployed anywhere.
 */
export function InviteShare({ code }: { code: string }) {
  async function copy(kind: "code" | "link") {
    const value = kind === "code" ? code : `${window.location.origin}/deals/join/${code}`;

    try {
      await navigator.clipboard.writeText(value);
      toast(kind === "code" ? "Invite code copied." : "Invite link copied.");
    } catch {
      // Clipboard access can be refused (insecure origin, permissions). The
      // code is on screen to copy by hand, so this says so rather than failing
      // silently, which is what the old label-flip did.
      toast("Could not reach the clipboard — copy the code by hand.", "danger");
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <p className="mb-1.5 text-xs uppercase tracking-wide text-[var(--muted)]">Invite code</p>
        <p className="break-all font-mono text-sm">{code}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => copy("code")}>
          Copy code
        </Button>
        <Button type="button" onClick={() => copy("link")}>
          Copy invite link
        </Button>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Send this to the other person only. Anyone holding it can join this deal as the other side,
        and it stops working the moment it is used once.
      </p>
    </div>
  );
}
