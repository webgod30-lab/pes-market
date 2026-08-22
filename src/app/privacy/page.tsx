import Link from "next/link";

import { SITE, legalDetailsAreConfigured } from "@/lib/site";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/deals";
import { LastUpdated, Notice, Points, Prose, Section } from "@/components/prose";
import { PageHeading } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { PRIVACY_PAGE, LEGAL_TRANSLATION_NOTICE } from "@/lib/legal-copy";

export const metadata = {
  title: "Privacy policy",
  description:
    "What data this escrow service collects, how account credentials are protected, what is public, and how long things are kept.",
};

export default async function PrivacyPage() {
  const configured = legalDetailsAreConfigured();
  const locale = await getLocale();
  const copy = PRIVACY_PAGE[locale];
  const translationNotice = LEGAL_TRANSLATION_NOTICE[locale];

  return (
    <Prose>
      <PageHeading title={copy.title} />
      <LastUpdated date={SITE.legalLastUpdated} locale={locale} />

      {translationNotice ? (
        <div className="mt-4">
          <Notice tone="info">{translationNotice}</Notice>
        </div>
      ) : null}

      {!configured ? (
        <div className="mt-6">
          <Notice>
            <strong>{copy.templateNoticeBold}</strong> {copy.templateNoticeBody}{" "}
            <code className="font-mono text-xs">src/lib/site.ts</code>
            {copy.templateNoticeTail}
          </Notice>
        </div>
      ) : null}

      <Section title={copy.whoControlsTitle}>
        <p>{copy.whoControls(SITE.operator, SITE.name, SITE.jurisdiction, SITE.supportEmail)}</p>
      </Section>

      <Section title={copy.whatWeCollectTitle}>
        <Points
          items={[
            <>
              <strong className="text-[var(--foreground)]">{copy.accountLabel}</strong>{" "}
              {copy.accountBody}
            </>,
            <>
              <strong className="text-[var(--foreground)]">{copy.dealsLabel}</strong> {copy.dealsBody}
            </>,
            <>
              <strong className="text-[var(--foreground)]">{copy.credentialsLabel}</strong>{" "}
              {copy.credentialsBody}
            </>,
            <>
              <strong className="text-[var(--foreground)]">{copy.paymentRefsLabel}</strong>{" "}
              {copy.paymentRefsBody}
            </>,
            <>
              <strong className="text-[var(--foreground)]">{copy.messagesLabel}</strong>{" "}
              {copy.messagesBody}
            </>,
          ]}
        />
      </Section>

      <Section title={copy.howProtectedTitle}>
        <p>{copy.howProtectedP1}</p>
        <p>{copy.howProtectedP2}</p>
      </Section>

      <Section title={copy.whatIsPublicTitle}>
        <p>{copy.whatIsPublicP1}</p>
        <p>{copy.whatIsPublicP2}</p>
      </Section>

      <Section title={copy.whoWeShareTitle}>
        <p>{copy.whoWeShareP1}</p>
        <p>{copy.whoWeShareP2}</p>
      </Section>

      <Section title={copy.howLongTitle}>
        <Points items={copy.howLongPoints(CONFIRMATION_WINDOW_HOURS)} />
      </Section>

      <Section title={copy.yourRightsTitle}>
        <p>{copy.yourRightsP1}</p>
        <p>{copy.yourRightsP2}</p>
      </Section>

      <Section title={copy.cookiesTitle}>
        <p>{copy.cookiesP1}</p>
        <p>{copy.cookiesP2}</p>
      </Section>

      <Section title={copy.analyticsTitle}>
        <p>{copy.analyticsP1}</p>
        <p>{copy.analyticsP2}</p>
        <p>{copy.analyticsP3}</p>
      </Section>

      <Section title={copy.securityTitle}>
        <p>
          {copy.securityP1Lead}{" "}
          <Link href="/contact" className="text-[var(--accent)] hover:underline">
            {copy.securityP1Link}
          </Link>{" "}
          {copy.securityP1Tail}
        </p>
      </Section>
    </Prose>
  );
}
