import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import {
  getReferralSummary,
  listReferralEarnings,
  listReferredUsers,
  FOUNDING_REWARD_CENTS,
  MINIMUM_PAYOUT_CENTS,
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

  const [summary, referred, earnings, balance] = await Promise.all([
    getReferralSummary(user.id),
    listReferredUsers(user.id),
    listReferralEarnings(user.id, 20),
    getBalance(user.id),
  ]);

  const shortfallCents = Math.max(0, MINIMUM_PAYOUT_CENTS - balance.availableCents);
  const dealsToGo = Math.ceil(shortfallCents / REFERRAL_REWARD_CENTS);

  const payoutDay = nextPayoutDate().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <DashShell
      groups={sectionsFor(user.role, {})}
      title="Promote & earn"
      description={`Share your code. You earn ${formatCents(REFERRAL_REWARD_CENTS)} every time someone who signed up with it completes a swap.`}
    >
      <div className="max-w-3xl space-y-3">
        <Card elevation="raised">
          <ReferralShare code={summary.referralCode} />

          <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--muted)]">
            Do not write the pitch yourself —{" "}
            <Link href="/explainer" className="text-[var(--accent)] hover:underline">
              the 60-second explainer
            </Link>{" "}
            has a paste-anywhere version and a video script with your code already in them.
          </p>
        </Card>

        {/* Only while it applies, and it says when it stops. A rate that
            quietly reverts is how a promoter finds out they were never told. */}
        {summary.foundingRateUntil ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] p-4">
            <p className="text-overline uppercase text-[var(--tone-success)]">Founding promoter</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              You earn{" "}
              <strong className="text-[var(--foreground)]">
                {formatCents(FOUNDING_REWARD_CENTS)} per completed swap
              </strong>{" "}
              instead of {formatCents(REFERRAL_REWARD_CENTS)}, until{" "}
              <strong className="text-[var(--foreground)]">
                {summary.foundingRateUntil.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </strong>
              . After that it returns to the standard rate — anything you earned before then keeps
              its value.
            </p>
          </div>
        ) : null}

        <StatGrid columns={3}>
          <StatCard
            label="Signed up with your code"
            value={String(summary.signUps)}
            caption={
              summary.signUps === 0
                ? "Nobody yet"
                : `${summary.activeSignUps} have completed a swap`
            }
          />
          <StatCard
            label="Earned all time"
            value={formatCents(summary.earnedCents, summary.currency)}
            caption={`${formatCents(summary.thisMonthCents, summary.currency)} this month`}
          />
          <StatCard
            label="Available to withdraw"
            value={formatCents(balance.availableCents, balance.currency)}
            caption={
              balance.meetsMinimum
                ? `Paid out on ${payoutDay}`
                : `${formatCents(shortfallCents, balance.currency)} to the minimum`
            }
          />
        </StatGrid>

        {/* The rules, once, in the place someone looks after seeing the
            numbers. Repeating them on the wallet page would be two copies to
            keep in step, so that page links here instead. */}
        <Card>
          <h2 className="text-sm font-semibold">How it pays</h2>

          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <strong className="text-[var(--foreground)]">
                {formatCents(REFERRAL_REWARD_CENTS)} per completed swap
              </strong>{" "}
              by anyone who signed up with your code. Both sides of a swap earn for their own
              promoter, so a deal between two people you introduced pays you twice.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">
                {formatCents(MINIMUM_PAYOUT_CENTS)} minimum
              </strong>{" "}
              before you can request a payout. Every payout is a transfer sent by hand, and smaller
              ones would go entirely on the fee.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Paid on the 1st of the month.</strong>{" "}
              Request it on any day once you are over the minimum; it goes out in the next batch, on{" "}
              {payoutDay}.
            </li>
            <li>
              You earn nothing from a deal you were part of yourself, and deals opened only to
              generate credits are reversed.
            </li>
          </ul>

          {balance.meetsMinimum ? (
            <p className="mt-4 border-t border-[var(--border)] pt-3 text-sm">
              <Link href="/wallet" className="font-medium text-[var(--accent)] hover:underline">
                Request your payout →
              </Link>
            </p>
          ) : summary.earnedCents > 0 ? (
            <p className="mt-4 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
              {dealsToGo} more completed {dealsToGo === 1 ? "deal" : "deals"} and you can request a
              payout.
            </p>
          ) : null}
        </Card>

        {/* --- who you brought in --- */}
        <Card>
          <h2 className="text-sm font-semibold">People you introduced</h2>
          <p className="mb-3 mt-1 text-xs text-[var(--muted)]">
            Everyone who signed up with your code, and what each has earned you.
          </p>

          {referred.length === 0 ? (
            <EmptyPanel icon="inbox" title="Nobody has used your code yet">
              Send the link above to anyone who trades eFootball accounts. They cannot create an
              account without a code from someone, so yours is as good as anyone&apos;s.
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
                      Joined {person.joinedAt.toLocaleDateString("en-GB")} ·{" "}
                      {person.completedDeals === 0
                        ? "no completed deals yet"
                        : `${person.completedDeals} completed ${person.completedDeals === 1 ? "deal" : "deals"}`}
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
            <h2 className="text-sm font-semibold">Recent credits</h2>
            <p className="mb-3 mt-1 text-xs text-[var(--muted)]">
              The last {earnings.length}. Your{" "}
              <Link href="/wallet" className="underline">
                balance page
              </Link>{" "}
              has the full list.
            </p>

            <ul className="space-y-2">
              {earnings.map((earning) => (
                <li
                  key={earning.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs">{earning.dealReference}</span>
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
            <Overline>You were introduced by</Overline>
            <p className="mt-1.5 text-sm">
              {summary.promoter.displayName}{" "}
              <span className="font-mono text-xs text-[var(--muted)]">
                ({summary.promoter.referralCode})
              </span>
            </p>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              They earn {formatCents(REFERRAL_REWARD_CENTS)} each time you complete a swap. It costs
              you nothing.
            </p>
          </Card>
        ) : null}
      </div>
    </DashShell>
  );
}
