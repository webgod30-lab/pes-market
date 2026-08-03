import Link from "next/link";
import QRCode from "qrcode";

import { requireUserOrProblem } from "@/lib/dal";
import { countUnusedRecoveryCodes, totpIsEnabled } from "@/lib/totp";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { Card, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Security — PES Escrow" };

// Reads the signed-in user, so it can never be prerendered.
export const dynamic = "force-dynamic";

/**
 * Renders the enrolment QR on the server.
 *
 * Passed down as a server action rather than generating in the browser: the
 * QR encodes the shared secret, and this keeps the qrcode library out of the
 * client bundle and the secret out of any URL.
 */
async function qrFor(uri: string): Promise<string> {
  "use server";

  return QRCode.toDataURL(uri, { margin: 1, width: 320, errorCorrectionLevel: "M" });
}

export default async function SecurityPage() {
  // null = any signed-in user; this page is not role-restricted.
  const auth = await requireUserOrProblem(null, "/settings/security");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const user = auth.user;

  const [enabled, recoveryCodesLeft] = await Promise.all([
    totpIsEnabled(user.id),
    countUnusedRecoveryCodes(user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        title="Security"
        description={`Signed in as ${user.email}.`}
      />

      <Card>
        <h2 className="text-sm font-semibold">Two-factor authentication</h2>
        <p className="mt-1.5 mb-5 text-sm leading-relaxed text-[var(--muted)]">
          A code from your phone on top of your password. Worth doing on any account here — a
          stolen password otherwise gives someone your deal history and anything mid-trade.
          {user.role === "admin" ? (
            <>
              {" "}
              <strong className="text-[var(--foreground)]">
                On this account it matters more than most:
              </strong>{" "}
              it approves every payout and can decrypt any account being traded.
            </>
          ) : null}
        </p>

        <TwoFactorSetup enabled={enabled} recoveryCodesLeft={recoveryCodesLeft} qrFor={qrFor} />
      </Card>

      <Card className="mt-3">
        <h2 className="text-sm font-semibold">Password</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
          There is no way to change or reset your password yet, and no email is sent from this
          service. If you are locked out,{" "}
          <Link href="/contact" className="text-[var(--accent)] hover:underline">
            get in touch
          </Link>
          .
        </p>
      </Card>

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          Back to your deals
        </Link>
      </p>
    </div>
  );
}
