import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import {
  destinationFields,
  getBalance,
  listWithdrawals,
  MINIMUM_WITHDRAWAL_CENTS,
  preferredPayoutMethodFor,
  WITHDRAWAL_TONE,
} from "@/lib/wallet";
import { listReferralEarnings, REFERRAL_REWARD_CENTS } from "@/lib/referrals";
import { formatCents } from "@/lib/money";
import {
  WithdrawForm,
  CancelWithdrawalButton,
  ConfirmTestButton,
} from "@/components/withdraw-form";
import { sectionsFor } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { Alert, Badge, Card, DetailList, Overline, SetupProblem } from "@/components/ui";
import type { WithdrawalStatus } from "@/generated/prisma/client";

export const metadata = { title: "Your balance" };

// Reads the signed-in user's money, so it can never be prerendered or cached.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  requested: "Waiting to be sent",
  sent: "Sent",
  rejected: "Refused",
  cancelled: "Cancelled",
};

export default async function WalletPage() {
  const auth = await requireUserOrProblem(null, "/wallet");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const user = auth.user;

  const [balance, earnings, withdrawals, preferredMethod] = await Promise.all([
    getBalance(user.id),
    listReferralEarnings(user.id),
    listWithdrawals(user.id),
    // Read here rather than carried on the session: it changes without a
    // re-login, and a stale copy in a cookie would preselect the wrong rail.
    preferredPayoutMethodFor(user.id),
  ]);

  const open = withdrawals.find((w) => w.status === "requested");

  // How far off the minimum they are. Shown as a number of deals rather than
  // only as money, because that is the thing a promoter can actually act on.
  const shortfallCents = Math.max(0, MINIMUM_WITHDRAWAL_CENTS - balance.availableCents);
  const dealsToGo = Math.ceil(shortfallCents / REFERRAL_REWARD_CENTS);

  return (
    <DashShell
      groups={sectionsFor(user.role, {})}
      title="Your balance"
      description="What you have earned from the people you brought to the site, and what you have taken out."
    >
      <div className="max-w-3xl">
      {/* --- the number, and what it is made of --- */}
      <Card elevation="raised">
        <Overline>Available to withdraw</Overline>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {formatCents(balance.availableCents, balance.currency)}
        </p>

        <dl className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Earned from referrals</dt>
            <dd className="tabular-nums">{formatCents(balance.earnedCents, balance.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Requested or already sent</dt>
            <dd className="tabular-nums">−{formatCents(balance.committedCents, balance.currency)}</dd>
          </div>
        </dl>

        {/* The two rules of the programme, stated where the number is rather
            than on a help page: what it takes to withdraw, and when the money
            actually moves. Both are the questions this page exists to answer. */}
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--tone-info-border)] bg-[var(--tone-info-bg)] p-4">
          {balance.meetsMinimum ? (
            <>
              <p className="text-overline uppercase text-[var(--tone-info)]">Ready to request</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                You are over the {formatCents(MINIMUM_WITHDRAWAL_CENTS, balance.currency)} minimum.
                Request a payout whenever you like — payouts are sent in one batch on the 1st of
                each month, so the next one goes out on{" "}
                <strong className="text-[var(--foreground)]">
                  {balance.nextPayoutAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </strong>
                .
              </p>
            </>
          ) : (
            <>
              <p className="text-overline uppercase text-[var(--tone-info)]">
                {formatCents(shortfallCents, balance.currency)} to go
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                The smallest payout is {formatCents(MINIMUM_WITHDRAWAL_CENTS, balance.currency)}.
                That is{" "}
                <strong className="text-[var(--foreground)]">
                  {dealsToGo} more completed {dealsToGo === 1 ? "deal" : "deals"}
                </strong>{" "}
                by the people you brought in. Payouts are sent on the 1st of each month.
              </p>
            </>
          )}
        </div>

        {/* Only reachable if a completed deal was reversed after the money went
            out. Saying so plainly beats showing a zero and no explanation. */}
        {balance.netCents < 0 ? (
          <Alert tone="danger" className="mt-4">
            Your balance is {formatCents(balance.netCents, balance.currency)}. A deal was reversed
            after you had been paid for it. Credits from the next deals your people complete go
            towards clearing that before anything can be withdrawn again.
          </Alert>
        ) : null}
      </Card>

      {/* --- request, or the one already in flight --- */}
      <Card className="mt-3">
        <h2 className="text-sm font-semibold">Withdraw</h2>

        {open ? (
          <div className="mt-3">
            <p className="text-sm text-[var(--muted)]">
              You have a withdrawal of{" "}
              <strong className="text-[var(--foreground)]">
                {formatCents(open.amountCents, open.currency)}
              </strong>{" "}
              waiting to be sent. You can only have one at a time.
            </p>
            <DetailList rows={destinationFields(open)} labelWidth="w-40" className="mt-2" />

            {/* The $1 test, on a first payout. Nothing else moves until they
                say it arrived — see lib/wallet.ts. */}
            {open.testSentAt && !open.testConfirmedAt ? (
              <ConfirmTestButton withdrawalId={open.id} reference={open.testReference} />
            ) : null}

            {open.testConfirmedAt ? (
              <p className="mt-2 text-xs text-[var(--tone-success)]">
                Test confirmed. The rest goes out in the next batch.
              </p>
            ) : null}

            <CancelWithdrawalButton withdrawalId={open.id} />
          </div>
        ) : (
          <div className="mt-3">
            <WithdrawForm
              availableCents={balance.availableCents}
              minimumCents={MINIMUM_WITHDRAWAL_CENTS}
              currency={balance.currency}
              preferredMethod={preferredMethod}
            />
          </div>
        )}
      </Card>

      {/* --- history --- */}
      <Card className="mt-3">
        <h2 className="text-sm font-semibold">Withdrawals</h2>

        {withdrawals.length === 0 ? (
          <div className="mt-3">
            <EmptyPanel icon="payout" title="Nothing withdrawn yet">
              Once your referral earnings reach{" "}
              {formatCents(MINIMUM_WITHDRAWAL_CENTS, balance.currency)}, you can request a payout
              here.
            </EmptyPanel>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {withdrawals.map((withdrawal) => (
              <li
                key={withdrawal.id}
                className="rounded-lg border border-[var(--border)] p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium tabular-nums">
                    {formatCents(withdrawal.amountCents, withdrawal.currency)}
                  </span>
                  <Badge tone={WITHDRAWAL_TONE[withdrawal.status]}>
                    {STATUS_LABEL[withdrawal.status]}
                  </Badge>
                </div>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Requested {withdrawal.requestedAt.toLocaleString("en-GB")}
                  {withdrawal.decidedAt
                    ? ` · ${withdrawal.status === "sent" ? "sent" : "closed"} ${withdrawal.decidedAt.toLocaleString("en-GB")}`
                    : ""}
                </p>

                <p className="mt-1.5 text-xs text-[var(--muted)]">
                  {destinationFields(withdrawal)
                    .map((field) => `${field.label}: ${field.value}`)
                    .join(" · ")}
                </p>

                {withdrawal.note ? (
                  <p className="mt-1.5 text-xs">
                    <span className="text-[var(--muted)]">
                      {withdrawal.status === "sent" ? "Reference: " : "Reason: "}
                    </span>
                    {withdrawal.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* --- where the money came from --- */}
      <Card className="mt-3">
        <h2 className="text-sm font-semibold">What is in the balance</h2>
        <p className="mt-1 mb-3 text-xs text-[var(--muted)]">
          Every {formatCents(REFERRAL_REWARD_CENTS, balance.currency)} credit, and the deal that
          earned it. This is the balance above, itemised — so you can check it rather than trust it.
        </p>

        {earnings.length === 0 ? (
          <EmptyPanel icon="folder" title="No referral earnings yet">
            You earn {formatCents(REFERRAL_REWARD_CENTS, balance.currency)} each time someone who
            signed up with your code completes a swap.{" "}
            <Link href="/referrals" className="underline">
              Share your code
            </Link>{" "}
            to get started.
          </EmptyPanel>
        ) : (
          <ul className="space-y-2">
            {earnings.map((earning) => (
              <li
                key={earning.id}
                className="rounded-lg border border-[var(--border)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs">{earning.dealReference}</span>
                  <span className="text-sm font-medium tabular-nums text-[var(--tone-success)]">
                    +{formatCents(earning.amountCents, earning.currency)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {earning.traderName} completed a swap ·{" "}
                  {earning.createdAt.toLocaleDateString("en-GB")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      </div>
    </DashShell>
  );
}
