import Link from "next/link";
import QRCode from "qrcode";

import { requireUserOrProblem } from "@/lib/dal";
import { countUnusedRecoveryCodes, totpIsEnabled } from "@/lib/totp";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { SettingsSection, SettingsShell } from "@/components/settings/settings-shell";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SetupProblem } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { SECURITY_PAGE } from "@/lib/page-copy";

export const metadata = { title: "Security" };

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
  const locale = await getLocale();
  const copy = SECURITY_PAGE[locale];

  const [enabled, recoveryCodesLeft] = await Promise.all([
    totpIsEnabled(user.id),
    countUnusedRecoveryCodes(user.id),
  ]);

  return (
    <SettingsShell user={user} title={copy.title} description={copy.description}>
      {/* The state of the account at a glance, before the controls that change
          it. "Two codes left" is the sort of thing you want to find out on this
          page rather than at a login prompt with a dead phone. */}
      <StatGrid columns={2}>
        <StatCard
          label={copy.twoFactor}
          value={enabled ? copy.on : copy.off}
          caption={enabled ? copy.onCaption : copy.offCaption}
          icon="shield"
          urgent={!enabled}
        />
        <StatCard
          label={copy.recoveryCodesLeft}
          value={enabled ? recoveryCodesLeft : "—"}
          caption={enabled ? copy.recoveryCodesLeftCaption : copy.recoveryCodesIssuedCaption}
          icon="ticket"
          // Running low matters; having none while 2FA is on is how an account
          // becomes permanently unreachable.
          urgent={enabled && recoveryCodesLeft <= 2}
        />
      </StatGrid>

      <div className="mt-3">
        <SettingsSection
          title={copy.twoFactorSectionTitle}
          description={
            <>
              {copy.twoFactorSectionBody}
              {user.role === "admin" ? (
                <>
                  {" "}
                  <strong className="text-[var(--foreground)]">{copy.twoFactorAdminNote}</strong>{" "}
                  {copy.twoFactorAdminBody}
                </>
              ) : null}
            </>
          }
        >
          <TwoFactorSetup enabled={enabled} recoveryCodesLeft={recoveryCodesLeft} qrFor={qrFor} locale={locale} />
        </SettingsSection>

        {/* Dashed and quieter on purpose: this is not a setting you can change,
            it is a statement that the feature does not exist yet. */}
        <SettingsSection
          title={copy.passwordSectionTitle}
          tone="muted"
          description={
            <>
              {copy.passwordSectionBody}{" "}
              <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">
                {copy.passwordSectionLink}
              </Link>
              .
            </>
          }
        />
      </div>
    </SettingsShell>
  );
}
