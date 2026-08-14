"use client";

import { Button, toast } from "@/components/ui";

/**
 * A promoter's code, and the two ways of handing it out.
 *
 * Modelled on InviteShare, and the origin is read the same way — at click time,
 * because the server does not know the browser's origin and a hardcoded one
 * breaks the moment this is deployed anywhere.
 *
 * The difference from an invite code is what it means to leak one. An invite
 * code is a secret that lets a stranger join your deal; this is the opposite —
 * it is meant to be posted publicly, and the more widely it spreads the better
 * it works. So there is no warning under it, and the link is the primary
 * button: a link fills the code in for whoever opens it, and a code someone has
 * to retype is a code they mistype.
 */
export function ReferralShare({ code }: { code: string }) {
  async function copy(kind: "code" | "link") {
    const value = kind === "code" ? code : `${window.location.origin}/register?ref=${code}`;

    try {
      await navigator.clipboard.writeText(value);
      toast(kind === "code" ? "Code copied." : "Invite link copied.");
    } catch {
      // Clipboard access can be refused (insecure origin, permissions). The
      // code is on screen to copy by hand, so say so rather than fail silently.
      toast("Could not reach the clipboard — copy it by hand.", "danger");
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
        <p className="text-overline uppercase text-[var(--muted)]">Your promoter code</p>
        <p className="mt-1.5 break-all font-mono text-2xl font-semibold tracking-wider">{code}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => copy("link")}>
          Copy invite link
        </Button>
        <Button type="button" variant="secondary" onClick={() => copy("code")}>
          Copy code
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-[var(--muted)]">
        Post it anywhere — nobody can sign up without a code, so this is how people get in. The link
        fills it in for them automatically.
      </p>
    </div>
  );
}
