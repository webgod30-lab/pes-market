import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { NoResetNotice, RecoveryRoutes } from "@/components/auth/recovery-routes";

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
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Locked out?"
      subtitle="What to do depends on which part you have lost."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            Back to sign in
          </Link>
        </>
      }
      aside="We will never email you a password reset link. If you receive one, it did not come from us — do not open it."
    >
      <div className="space-y-4">
        <NoResetNotice />

        <RecoveryRoutes />
      </div>
    </AuthShell>
  );
}
