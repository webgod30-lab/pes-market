import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUserQuietly } from "@/lib/dal";
import { getLocale } from "@/lib/locale-server";
import { PROMOTE } from "@/lib/promoter-copy";
import {
  listRecentPayouts,
  MINIMUM_PAYOUT_CENTS,
  MINIMUM_TEAM_STRENGTH,
  REFERRAL_REWARD_CENTS,
} from "@/lib/referrals";
import { formatCents } from "@/lib/money";
import { SITE } from "@/lib/site";
import { PromoterApplyForm } from "@/components/promoter-apply-form";
import { PayoutTicker } from "@/components/payout-ticker";
import { PublisherWarning } from "@/components/publisher-warning";
import { Card, PageHeading } from "@/components/ui";
import { Prose, Section } from "@/components/prose";

export const metadata = {
  title: "Become a promoter",
  description:
    "Your code is the door — nobody registers on PESescrow.com without one. Earn $2 every time someone who used yours completes a swap of two 3000+ rated accounts. No code needed to apply.",
};

/**
 * The public way in.
 *
 * Everywhere else on this site needs a promoter's code, which makes it closed:
 * the only people who can join are people who already know a member. That works
 * for traders, who arrive in pairs having already agreed a swap, and not at all
 * for somebody who wants to advertise the service and knows nobody.
 *
 * So this page takes no code. It is the only one that does not.
 *
 * The order is deliberate: what you earn comes before what you cannot do. An
 * earlier version led with the restriction, and the people best placed to
 * promote this — traders with reputations — read "cannot open or join a swap"
 * as "not for me" and left.
 *
 * Every string comes from lib/promoter-copy so the page follows the language
 * menu. It used to be written inline in English, which made this the one page
 * that ignored the switch — on a recruitment page aimed at Arabic-speaking
 * communities, that was the worst place on the site for it to happen.
 */
export default async function PromotePage() {
  // Quietly: this page must render with a broken database so the form can
  // report the real reason on submit.
  const user = await getCurrentUserQuietly();

  // Anyone signed in already has a code — send them to it rather than letting
  // them apply for something they have.
  if (user) redirect(user.role === "admin" ? "/admin/promoters" : "/referrals");

  const locale = await getLocale();
  const copy = PROMOTE[locale];

  // Tolerates failure for the same reason: a page that cannot render is worse
  // than one missing a list.
  const payouts = await listRecentPayouts().catch(() => []);

  return (
    <Prose>
      <PageHeading title={copy.title} description={copy.subtitle} />

      <p className="text-base leading-relaxed">
        {copy.leadOne}{" "}
        <strong className="text-[var(--foreground)]">{formatCents(REFERRAL_REWARD_CENTS)}</strong>{" "}
        {copy.leadOneTail}
      </p>

      <p className="mt-3 text-base leading-relaxed">{copy.leadTwo}</p>

      {/* The network's track record, said before the mechanics.
          Attributed to the network rather than to this site, deliberately: the
          platform is new and its own numbers are small, so a promoter who read
          "200 promoters" and then saw a handful of deals here would conclude
          the figure was invented. Saying where it comes from is what keeps a
          true claim believable. */}
      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <p className="text-overline uppercase text-[var(--muted)]">{copy.networkOverline}</p>

        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--muted)]">{copy.networkPromoters}</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
              {SITE.network.promoters}+
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">{copy.networkPayout}</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
              ${(SITE.network.monthlyPayoutUsd / 1000).toFixed(0)}k+
            </dd>
          </div>
        </dl>

        <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--muted)]">
          {copy.networkBody}
        </p>
      </div>

      {/* Straight after the network figures, because it is the evidence for
          them. A number on a page is a claim; a name and an amount from twenty
          minutes ago is the thing that makes the claim land. Renders nothing at
          all until there is something real to show. */}
      <PayoutTicker payouts={payouts} locale={locale} />

      <Section title={copy.howTitle}>
        <ol className="space-y-2">
          <li>
            <strong className="text-[var(--foreground)]">{copy.howApply}</strong> {copy.howApplyBody}
          </li>
          <li>
            <strong className="text-[var(--foreground)]">{copy.howCode}</strong> {copy.howCodeBody}
          </li>
          <li>
            <strong className="text-[var(--foreground)]">{copy.howEarn}</strong> {copy.howEarnBody}
          </li>
        </ol>
      </Section>

      <Section title={copy.earnTitle}>
        {/* Scrolls on its own rather than pushing the page sideways on a phone. */}
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[22rem] border-collapse text-sm">
            <tbody>
              <Row
                label={copy.earnPerSwap}
                value={formatCents(REFERRAL_REWARD_CENTS)}
                note={copy.earnStrengthNote.replace("{n}", String(MINIMUM_TEAM_STRENGTH))}
              />
              <Row
                label={
                  <>
                    {copy.earnBothLead}{" "}
                    <strong className="text-[var(--foreground)]">{copy.earnBothBold}</strong>{" "}
                    {copy.earnBothTail}
                  </>
                }
                value={formatCents(REFERRAL_REWARD_CENTS * 2)}
              />
              <Row label={copy.earnPayoutsAt} value={formatCents(MINIMUM_PAYOUT_CENTS)} />
              <Row label={copy.earnPaid} value={copy.earnPaidValue} note={copy.earnPaidNote} />
            </tbody>
          </table>
        </div>
      </Section>

      {/* Directly under the earnings table, because "how do I actually get the
          money" is the next question and the site previously had no answer to
          it anywhere. In a niche where everyone has been scammed at least once,
          an unanswered payment question is not a gap — it reads as evasion. */}
      <Section title={copy.paidTitle}>
        <p>{copy.paidIntro}</p>

        <div className="-mx-1 mt-3 overflow-x-auto px-1">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 pe-4 text-start font-medium">{copy.paidMethod}</th>
                <th className="py-2 pe-4 text-start font-medium">{copy.paidSpeed}</th>
                <th className="py-2 text-start font-medium">{copy.paidNotes}</th>
              </tr>
            </thead>
            <tbody>
              <PayoutRow
                method="USDT (TRC-20)"
                speed={copy.paidCryptoSpeed}
                note={copy.paidCryptoNote}
              />
              <PayoutRow method="PayPal" speed={copy.paidPaypalSpeed} note={copy.paidPaypalNote} />
              <PayoutRow
                method={copy.paidGift}
                speed={copy.paidGiftSpeed}
                note={copy.paidGiftNote}
              />
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          <strong className="text-[var(--foreground)]">{copy.paidFeeBold}</strong> {copy.paidFeeBody}
        </p>

        <p>
          <strong className="text-[var(--foreground)]">{copy.paidUsdBold}</strong>{" "}
          {formatCents(MINIMUM_PAYOUT_CENTS)} {copy.paidUsdBody}
        </p>

        <p>
          <strong className="text-[var(--foreground)]">{copy.paidTestBold}</strong>{" "}
          {copy.paidTestBody}
        </p>

        <p>
          <strong className="text-[var(--foreground)]">{copy.paidReceiptBold}</strong>{" "}
          {copy.paidReceiptBody}
        </p>
      </Section>

      <Section title={copy.bothTitle}>
        <p>
          {copy.bothAsk} <strong>{copy.bothAnswer}</strong>
        </p>
        <p>{copy.bothBody}</p>
        {/* The one thing the audit's copy left out, and it matters: the terms
            ban extra accounts used to multiply credits, and a trading account
            registered under your OWN code is exactly that. Saying so here is
            cheaper than reversing the credits later. */}
        <p>
          {copy.bothRuleLead}{" "}
          <strong className="text-[var(--foreground)]">{copy.bothRuleBold}</strong>{" "}
          {copy.bothRuleTail}
        </p>
      </Section>

      <Section title={copy.bestTitle}>
        <ul className="space-y-1.5">
          {copy.best.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>

      <Section title={copy.removedTitle}>
        <p>{copy.removedBody}</p>
      </Section>

      <Section title={copy.warningTitle}>
        <PublisherWarning locale={locale} />
        <p className="mt-3">{copy.warningTail}</p>
      </Section>

      <Section title={copy.applyTitle}>
        <p>{copy.applyBody}</p>
      </Section>

      <Card elevation="raised">
        <PromoterApplyForm locale={locale} />
      </Card>

      <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
        {copy.alreadyLead}{" "}
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          {copy.alreadyLink}
        </Link>{" "}
        {copy.alreadyTail}
      </p>
    </Prose>
  );
}

function PayoutRow({ method, speed, note }: { method: string; speed: string; note: string }) {
  return (
    <tr className="border-b border-[var(--border)] align-top last:border-0">
      <td className="py-2.5 pe-4 font-semibold whitespace-nowrap">{method}</td>
      <td className="py-2.5 pe-4 whitespace-nowrap text-[var(--muted)]">{speed}</td>
      <td className="py-2.5 leading-relaxed text-[var(--muted)]">{note}</td>
    </tr>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: React.ReactNode;
  value: string;
  note?: string;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="py-2.5 pe-4 align-top leading-relaxed text-[var(--muted)]">
        {label}
        {note ? <span className="mt-0.5 block text-xs">{note}</span> : null}
      </td>
      <td className="py-2.5 text-end align-top font-semibold tabular-nums whitespace-nowrap">
        {value}
      </td>
    </tr>
  );
}
