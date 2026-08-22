import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { NoResetNotice, RecoveryRoutes } from "@/components/auth/recovery-routes";
import { Alert } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { RESET_PASSWORD_PAGE } from "@/lib/auth-copy";

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

  const locale = await getLocale();
  const copy = RESET_PASSWORD_PAGE[locale];

  return (
    <AuthShell
      title={arrivedFromLink ? copy.titleForged : copy.titleDefault}
      subtitle={arrivedFromLink ? copy.subtitleForged : copy.subtitleDefault}
      footer={
        <>
          {copy.goTo}{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            {copy.signInInstead}
          </Link>{" "}
          {copy.instead}
        </>
      }
      aside={copy.aside}
    >
      <div className="space-y-4">
        {arrivedFromLink ? (
          <Alert tone="danger" title={copy.alertTitle}>
            {copy.alertBody}{" "}
            <Link href="/settings/security" className="underline">
              {copy.alertSecurity}
            </Link>{" "}
            {copy.alertTail}
          </Alert>
        ) : (
          <NoResetNotice locale={locale} />
        )}

        <RecoveryRoutes locale={locale} />
      </div>
    </AuthShell>
  );
}
