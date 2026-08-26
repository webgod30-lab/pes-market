import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { getLocale } from "@/lib/locale-server";
import { REFERRALS } from "@/lib/promoter-copy";
import {
  getReferralSummary,
  listReferralEarnings,
  listReferredUsers,
  MINIMUM_PAYOUT_CENTS,
  MINIMUM_TEAM_STRENGTH,
  nextPayoutDate,
  REFERRAL_REWARD_CENTS,
} from "@/lib/referrals";
import { getBalance } from "@/lib/wallet";
import { formatCents } from "@/lib/money";
import { ReferralShare } from "@/components/referral-share";
import { sectionsFor } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Card, Overline, SetupProblem } from "@/components/ui";

export const metadata = { title: "Promote & earn" };

// Reads the signed-in user's earnings, so it can never be prerendered.
export const dynamic = "force-dynamic";

/**
 * The promoter page.
 *
 * Everyone is a promoter — there is no application and no separate role — so
 * this is a page every account has from the moment it is created. It answers
 * four questions in the order people ask them: what is my code, how much have I
 * made, who made it for me, and when do I get it.
 */
export default async function ReferralsPage() {
  const auth = await requireUserOrProblem(null, "/referrals");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const user = auth.user;
  const locale = await getLocale();
  const copy = REFERRALS[locale];

  const [summary, referred, earnings, balance] = await Promise.all([
    getReferralSummary(user.id),
    listReferredUsers(user.id),
    listReferralEarnings(user.id, 20),
    getBalance(user.id),
  ]);

  const shortfallCents = Math.max(0, MINIMUM_PAYOUT_CENTS - balance.availableCents);
  const dealsToGo = Math.ceil(shortfallCents / REFERRAL_REWARD_CENTS);

  // The one date on the page written out in words rather than digits, so it is
  // the one that has to follow the language. The dd/mm/yyyy stamps further down
  // stay numeric, as they are everywhere else on the site.
  const payoutDay = nextPayoutDate().toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  /** "{n} completed deals", in whichever order the language wants them. */
  const completedDeals = (n: number) =>
    copy.completedDeals
      .replace("{n}", String(n))
      .replace("{noun}", n === 1 ? copy.dealSingular : copy.dealPlural);

  return (
    <DashShell
      groups={sectionsFor(user.role, {}, locale)}
      title={copy.title}
      description={`${copy.subtitleLead} ${formatCents(REFERRAL_REWARD_CENTS)} ${copy.subtitleTail}`}
    >
      <div className="max-w-3xl space-y-3">
        <Card elevation="raised">
          <ReferralShare code={summary.referralCode} locale={locale} />

          <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--muted)]">
            {copy.kitLead}{" "}
            <Link href="/explainer" className="text-[var(--accent)] hover:underline">
              {copy.kitLink}
            </Link>{" "}
            {copy.kitTail}
          </p>
        </Card>

        <StatGrid columns={3}>
          <StatCard
            label={copy.statSignUps}
            value={String(summary.signUps)}
            caption={
              summary.signUps === 0
                ? copy.statNobody
                : `${summary.activeSignUps} ${copy.statCompletedSuffix}`
            }
          />
          <StatCard
            label={copy.statEarned}
            value={formatCents(summary.earnedCents, summary.currency)}
            caption={`${formatCents(summary.thisMonthCents, summary.currency)} ${copy.statThisMonth}`}
          />
          <StatCard
            label={copy.statAvailable}
            value={formatCents(balance.availableCents, balance.currency)}
            caption={
              balance.meetsMinimum
                ? `${copy.statPaidOn} ${payoutDay}`
                : `${formatCents(shortfallCents, balance.currency)} ${copy.statToMinimum}`
            }
          />
        </StatGrid>

        {/* The rules, once, in the place someone looks after seeing the
            numbers. Repeating them on the wallet page would be two copies to
            keep in step, so that page links here instead. */}
        <Card>
          <h2 className="text-sm font-semibold">{copy.paysTitle}</h2>

          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <strong className="text-[var(--foreground)]">
                {formatCents(REFERRAL_REWARD_CENTS)} {copy.paysRateTail}
              </strong>{" "}
              {copy.paysRateBody}
            </li>
            <li>
              <strong className="text-[var(--foreground)]">
                {formatCents(MINIMUM_PAYOUT_CENTS)} {copy.paysMinimumTail}
              </strong>{" "}
              {copy.paysMinimumBody}
            </li>
            <li>
              <strong className="text-[var(--foreground)]">{copy.paysDateBold}</strong>{" "}
              {copy.paysDateBody} {payoutDay}.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">
                {copy.paysStrengthBold.replace("{n}", String(MINIMUM_TEAM_STRENGTH))}
              </strong>{" "}
              {copy.paysStrengthBody}
            </li>
            <li>{copy.paysOwnDeals}</li>
          </ul>

          {balance.meetsMinimum ? (
            <p className="mt-4 border-t border-[var(--border)] pt-3 text-sm">
              <Link href="/wallet" className="font-medium text-[var(--accent)] hover:underline">
                {copy.paysRequest}
              </Link>
            </p>
          ) : summary.earnedCents > 0 ? (
            <p className="mt-4 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
              {copy.paysToGo
                .replace("{n}", String(dealsToGo))
                .replace("{noun}", dealsToGo === 1 ? copy.dealSingular : copy.dealPlural)}
            </p>
          ) : null}
        </Card>

        {/* --- who you brought in --- */}
        <Card>
          <h2 className="text-sm font-semibold">{copy.introducedTitle}</h2>
          <p className="mb-3 mt-1 text-xs text-[var(--muted)]">{copy.introducedBody}</p>

          {referred.length === 0 ? (
            <EmptyPanel icon="inbox" title={copy.introducedEmptyTitle}>
              {copy.introducedEmptyBody}
            </EmptyPanel>
          ) : (
            <ul className="space-y-2">
              {referred.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{person.displayName}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {copy.joined} {person.joinedAt.toLocaleDateString("en-GB")} ·{" "}
                      {person.completedDeals === 0
                        ? copy.noDealsYet
                        : completedDeals(person.completedDeals)}
                    </p>
                  </div>
                  <span
                    className={
                      person.earnedCents > 0
                        ? "text-sm font-medium tabular-nums text-[var(--tone-success)]"
                        : "text-sm tabular-nums text-[var(--muted)]"
                    }
                  >
                    {person.earnedCents > 0 ? "+" : ""}
                    {formatCents(person.earnedCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* --- the credits themselves --- */}
        {earnings.length > 0 ? (
          <Card>
            <h2 className="text-sm font-semibold">{copy.creditsTitle}</h2>
            <p className="mb-3 mt-1 text-xs text-[var(--muted)]">
              {copy.creditsLead} {earnings.length}
              {copy.creditsMid}{" "}
              <Link href="/wallet" className="underline">
                {copy.creditsLink}
              </Link>{" "}
              {copy.creditsTail}
            </p>

            <ul className="space-y-2">
              {earnings.map((earning) => (
                <li
                  key={earning.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3 text-sm"
                >
                  <div className="min-w-0">
                    <span dir="ltr" className="font-mono text-xs">
                      {earning.dealReference}
                    </span>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {earning.traderName} · {earning.createdAt.toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-[var(--tone-success)]">
                    +{formatCents(earning.amountCents, earning.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* --- who introduced you --- */}
        {summary.promoter ? (
          <Card>
            <Overline>{copy.byTitle}</Overline>
            <p className="mt-1.5 text-sm">
              {summary.promoter.displayName}{" "}
              <span dir="ltr" className="font-mono text-xs text-[var(--muted)]">
                ({summary.promoter.referralCode})
              </span>
            </p>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              {copy.byLead} {formatCents(REFERRAL_REWARD_CENTS)} {copy.byTail}
            </p>
          </Card>
        ) : null}
      </div>
    </DashShell>
  );
}
