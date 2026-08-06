import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { NoResetNotice, RecoveryRoutes } from "@/components/auth/recovery-routes";
import { Alert } from "@/components/ui";

export const metadata = {
  title: "Reset password",
  description:
    "PESescrow.com does not send password reset emails. If you followed a reset link claiming to be from us, it was not.",
  // Nothing here should be indexed: it exists to catch people arriving from a
  // link, not to be found in a search for "reset password".
  robots: { index: false, follow: false },
};

/**
 * Where a password-reset link lands.
 *
 * This service issues no reset tokens and sends no email, so there is no valid
 * link that can arrive here — which makes this page more useful than a stub,
 * not less. Anyone who reaches it holding a token followed a link that this
 * service did not send, and the most valuable thing the page can do is say so
 * before they type a password into whatever sent them.
 *
 * That is not a hypothetical. An escrow service is a natural phishing target,
 * and "reset your password" is the oldest pretext there is. Because we send no
 * mail at all, the rule is unusually clean and worth stating outright: every
 * reset email claiming to be from us is forged.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  // In Next.js 16 searchParams is a Promise and must be awaited.
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Only ever tested for presence, never rendered. Echoing an attacker-supplied
  // string back into the page is how a reflected attack starts, and there is
  // nothing useful to show them anyway.
  //
  // Next.js still serialises the URL into its own routing payload, as it does
  // for every page that reads searchParams — that is the framework's, not ours,
  // and React escapes it. The point of the rule is that nothing here puts it
  // into the document body.
  const arrivedFromLink = typeof token === "string" && token.length > 0;

  return (
    <AuthShell
      title={arrivedFromLink ? "That link did not come from us" : "Reset your password"}
      subtitle={
        arrivedFromLink
          ? "Do not enter your password on the page that sent you here."
          : "There is no automated reset on this service — here is what does work."
      }
      footer={
        <>
          Go to{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            sign in
          </Link>{" "}
          instead
        </>
      }
      aside="Your password is only ever typed on pesescrow.com. Check the address bar before you type it anywhere."
    >
      <div className="space-y-4">
        {arrivedFromLink ? (
          <Alert tone="danger" title="This service has never sent a password reset email.">
            It cannot — there is no mail provider connected to it and no reset link is ever
            generated. Whatever sent you here is impersonating us. Do not enter your password or
            your recovery codes anywhere it asks. If you already have, change your password from{" "}
            <Link href="/settings/security" className="underline">
              your security settings
            </Link>{" "}
            as soon as you can sign in, and tell us.
          </Alert>
        ) : (
          <NoResetNotice />
        )}

        <RecoveryRoutes />
      </div>
    </AuthShell>
  );
}
