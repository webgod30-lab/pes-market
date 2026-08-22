import Link from "next/link";

import { SITE, legalDetailsAreConfigured } from "@/lib/site";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/deals";
import { LastUpdated, Notice, Points, Prose, Section } from "@/components/prose";
import { PageHeading } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { TERMS_PAGE, LEGAL_TRANSLATION_NOTICE } from "@/lib/legal-copy";

export const metadata = {
  title: "Terms of service",
  description: "The rules for using this escrow service, and the limits of what it covers.",
};

export default async function TermsPage() {
  const configured = legalDetailsAreConfigured();
  const locale = await getLocale();
  const copy = TERMS_PAGE[locale];
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
            <code className="font-mono text-xs">src/lib/site.ts</code> {copy.templateNoticeTail}
          </Notice>
        </div>
      ) : null}

      <Section title={copy.s1Title}>
        <p>{copy.s1p1(SITE.name, SITE.operator)}</p>
        <p>
          {copy.s1p2Lead}{" "}
          <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">
            {copy.s1p2Link}
          </Link>
          .
        </p>
      </Section>

      <Section title={copy.s2Title}>
        <Points items={copy.s2Points} />
      </Section>

      <Section title={copy.s3Title}>
        <p>{copy.s3p1}</p>
        <p>{copy.s3p2}</p>
      </Section>

      <Section title={copy.s4Title}>
        <p>{copy.s4p1}</p>
      </Section>

      <Section title={copy.s5Title}>
        <Points items={copy.s5Points(CONFIRMATION_WINDOW_HOURS)} />
      </Section>

      <Section title={copy.s5aTitle}>
        <Points items={copy.s5aPoints} />
      </Section>

      <Section title={copy.s5bTitle}>
        <p>{copy.s5bp1}</p>
        <p>{copy.s5bp2}</p>
        <p>{copy.s5bp3}</p>
      </Section>

      <Section title={copy.s6Title}>
        <p>{copy.s6p1}</p>
        <p>{copy.s6p2}</p>
      </Section>

      <Section title={copy.s7Title}>
        <Points items={copy.s7Points} />
        <p>{copy.s7p1}</p>
      </Section>

      <Section title={copy.s8Title}>
        <p>{copy.s8p1}</p>
        <p>{copy.s8p2}</p>
      </Section>

      <Section title={copy.s9Title}>
        <p>{copy.s9p1(SITE.jurisdiction)}</p>
        <p>
          {copy.s9p2Lead}{" "}
          <Link href="/contact" className="text-[var(--accent)] hover:underline">
            {copy.s9p2Link}
          </Link>
          .
        </p>
      </Section>
    </Prose>
  );
}
