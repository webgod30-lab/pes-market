import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { NoResetNotice, RecoveryRoutes } from "@/components/auth/recovery-routes";
import { getLocale } from "@/lib/locale-server";
import { FORGOT_PASSWORD_PAGE } from "@/lib/auth-copy";

export const metadata = {
  title: "Forgot password",
  description:
    "How to get back into a PESescrow.com account: recovery codes for a lost authenticator, and how to reach us if you have forgotten your password.",
};

/**
 * Locked out.
 *
 * There is deliberately no form on this page, and that needs saying plainly
 * because a "reset your password" form is what everybody expects here.
 *
 * This service has no email provider and no password-reset token. A form that
 * took an address and said "check your inbox" would be a lie told to someone
 * who is already locked out of an account that may be holding their money —
 * they would wait for a message that is never coming, instead of contacting us
 * on the first day. So the page says what is actually true and routes people to
 * the two ways back in that genuinely exist.
 *
 * When a mail provider and a reset token do land, this page becomes the form
 * and the shell around it does not change.
 */
export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  const copy = FORGOT_PASSWORD_PAGE[locale];

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <>
          {copy.remembered}{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            {copy.backToSignIn}
          </Link>
        </>
      }
      aside={copy.aside}
    >
      <div className="space-y-4">
        <NoResetNotice locale={locale} />

        <RecoveryRoutes locale={locale} />
      </div>
    </AuthShell>
  );
}
