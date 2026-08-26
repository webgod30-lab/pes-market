import Link from "next/link";

import { escrowSteps } from "@/lib/escrow-flow";
import { getLocale } from "@/lib/locale-server";
import { HOW_IT_WORKS } from "@/lib/page-copy";
import { Prose, Section, Points } from "@/components/prose";
import { ButtonLink, Card, PageHeading } from "@/components/ui";

export const metadata = {
  title: "How it works",
  description:
    "How an escrowed eFootball account swap works, step by step: what each side deposits, what the admin checks, and when the accounts actually change hands. Free — and you earn $2 for every 3000+ swap you refer.",
};

export default async function HowItWorksPage() {
  const locale = await getLocale();
  const copy = HOW_IT_WORKS[locale];
  const steps = escrowSteps(locale);

  return (
    <Prose>
      <PageHeading title={copy.title} description={copy.intro} />

      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.n}>
            <Card>
              <div className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-bold text-emerald-950">
                  {step.n}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    {step.who}
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold">{step.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{step.long}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Section title={copy.costTitle}>
        <p>{copy.costBody}</p>
        <p>{copy.costWhy}</p>
      </Section>

      {/* Before the dispute section, because it is the thing that stops someone
          reaching the sign-up form and being turned away by a field they did
          not know existed. */}
      <Section title={copy.joinTitle}>
        <p>{copy.joinBody}</p>
      </Section>

      <Section title={copy.earnTitle}>
        <p>{copy.earnBody}</p>
        <p>{copy.earnPayout}</p>
      </Section>

      <Section title={copy.wrongTitle}>
        <p>{copy.wrongBody}</p>
        <p>{copy.wrongBefore}</p>
      </Section>

      <Section title={copy.rulesTitle}>
        <Points items={copy.rules} />
      </Section>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/register">{copy.ctaStart}</ButtonLink>
        <ButtonLink href="/faq" variant="secondary">
          {copy.ctaFaq}
        </ButtonLink>
      </div>

      <p className="mt-6 text-xs text-[var(--muted)]">
        {copy.unsure}{" "}
        <Link href="/contact" className="text-[var(--accent)] hover:underline">
          {copy.getInTouch}
        </Link>{" "}
        {copy.beforeSending}
      </p>
    </Prose>
  );
}
