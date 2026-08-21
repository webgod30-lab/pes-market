import Link from "next/link";

import { getCurrentUserQuietly } from "@/lib/dal";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/escrow-flow";
import { getLocale } from "@/lib/locale-server";
import { EXPLAINER } from "@/lib/promoter-copy";
import { CopyBlock } from "@/components/copy-block";
import { PublisherWarning } from "@/components/publisher-warning";
import { Card, PageHeading } from "@/components/ui";
import { Prose, Section } from "@/components/prose";

export const metadata = {
  title: "The 60-second explainer",
  description:
    "Everything you need to explain PESescrow.com in one minute — a paste-anywhere summary and a 60-second video script, with your own referral code already in them.",
};

export const dynamic = "force-dynamic";

/**
 * The promoter kit.
 *
 * A promoter's effort should be pasting, not writing. Every one of them
 * otherwise ends up explaining the service in their own words, which means the
 * service gets explained badly and differently in twenty places — and the
 * places it gets explained wrong are the safety caveats, which are the ones
 * that matter.
 *
 * Signed in, the code below is theirs. Signed out it shows a placeholder, so
 * the page still works as something to link to.
 *
 * The pasteable text is translated along with the page around it. Handing an
 * Arabic-speaking promoter an English paragraph to post in an Arabic group is
 * the same as handing them nothing: they would rewrite it themselves, which is
 * the exact failure this page exists to prevent.
 */
export default async function ExplainerPage() {
  const user = await getCurrentUserQuietly();
  const locale = await getLocale();
  const copy = EXPLAINER[locale];

  const code = user
    ? await (async () => {
        const { prisma } = await import("@/lib/prisma");
        const row = await prisma.user
          .findUnique({ where: { id: user.id }, select: { referralCode: true } })
          .catch(() => null);

        return row?.referralCode ?? "YOUR-CODE";
      })()
    : "YOUR-CODE";

  const paste = copy.paste(code, CONFIRMATION_WINDOW_HOURS);
  const script = copy.script(code, CONFIRMATION_WINDOW_HOURS);

  return (
    <Prose>
      <PageHeading title={copy.title} description={copy.subtitle} />

      {user ? (
        <p className="text-sm text-[var(--muted)]">{copy.signedIn}</p>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            {copy.signedOutLink}
          </Link>{" "}
          {copy.signedOutLead} <code className="font-mono text-xs">YOUR-CODE</code>{" "}
          {copy.signedOutTail}
        </p>
      )}

      <Section title={copy.pasteTitle}>
        <p>{copy.pasteBody}</p>
        <CopyBlock text={paste} label={copy.pasteLabel} locale={locale} className="mt-3" />
      </Section>

      <Section title={copy.scriptTitle}>
        <p>{copy.scriptBody}</p>
        <CopyBlock text={script} label={copy.scriptLabel} locale={locale} className="mt-3" />
      </Section>

      <Section title={copy.questionTitle}>
        <p>{copy.questionBody}</p>
      </Section>

      <PublisherWarning locale={locale} />

      <Card className="mt-6">
        <h2 className="text-sm font-semibold">{copy.avoidTitle}</h2>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-[var(--muted)]">
          {copy.avoid.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Card>

      <p className="mt-6 text-xs text-[var(--muted)]">
        <Link href="/referrals" className="text-[var(--accent)] hover:underline">
          {copy.footEarnings}
        </Link>{" "}
        ·{" "}
        <Link href="/promote" className="text-[var(--accent)] hover:underline">
          {copy.footPays}
        </Link>
      </p>
    </Prose>
  );
}
