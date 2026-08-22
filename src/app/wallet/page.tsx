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
import { getLocale } from "@/lib/locale-server";
import { WALLET_PAGE } from "@/lib/page-copy";

export const metadata = { title: "Your balance" };

// Reads the signed-in user's money, so it can never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const auth = await requireUserOrProblem(null, "/wallet");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const user = auth.user;
  const locale = await getLocale();
  const copy = WALLET_PAGE[locale];

  const STATUS_LABEL: Record<WithdrawalStatus, string> = {
    requested: copy.statusRequested,
    sent: copy.statusSent,
    rejected: copy.statusRejected,
    cancelled: copy.statusCancelled,
  };

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
      title={copy.title}
      description={copy.description}
    >
      <div className="max-w-3xl">
      {/* --- the number, and what it is made of --- */}
      <Card elevation="raised">
        <Overline>{copy.availableToWithdraw}</Overline>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {formatCents(balance.availableCents, balance.currency)}
        </p>

        <dl className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">{copy.earnedFromReferrals}</dt>
            <dd className="tabular-nums">{formatCents(balance.earnedCents, balance.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">{copy.requestedOrSent}</dt>
            <dd className="tabular-nums">−{formatCents(balance.committedCents, balance.currency)}</dd>
          </div>
        </dl>

        {/* The two rules of the programme, stated where the number is rather
            than on a help page: what it takes to withdraw, and when the money
            actually moves. Both are the questions this page exists to answer. */}
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--tone-info-border)] bg-[var(--tone-info-bg)] p-4">
          {balance.meetsMinimum ? (
            <>
              <p className="text-overline uppercase text-[var(--tone-info)]">{copy.readyToRequest}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {copy.readyBody(formatCents(MINIMUM_WITHDRAWAL_CENTS, balance.currency))}{" "}
                <strong className="text-[var(--foreground)]">
                  {balance.nextPayoutAt.toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
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
                {copy.toGo(formatCents(shortfallCents, balance.currency))}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {copy.notReadyBody(formatCents(MINIMUM_WITHDRAWAL_CENTS, balance.currency))}{" "}
                <strong className="text-[var(--foreground)]">{copy.moreCompletedDeal(dealsToGo)}</strong>{" "}
                {copy.notReadyTail}
              </p>
            </>
          )}
        </div>

        {/* Only reachable if a completed deal was reversed after the money went
            out. Saying so plainly beats showing a zero and no explanation. */}
        {balance.netCents < 0 ? (
          <Alert tone="danger" className="mt-4">
            {copy.negativeBalance(formatCents(balance.netCents, balance.currency))}
          </Alert>
        ) : null}
      </Card>

      {/* --- request, or the one already in flight --- */}
      <Card className="mt-3">
        <h2 className="text-sm font-semibold">{copy.withdraw}</h2>

        {open ? (
          <div className="mt-3">
            <p className="text-sm text-[var(--muted)]">
              {copy.hasOpenLead}{" "}
              <strong className="text-[var(--foreground)]">
                {formatCents(open.amountCents, open.currency)}
              </strong>{" "}
              {copy.hasOpenTail}
            </p>
            <DetailList rows={destinationFields(open)} labelWidth="w-40" className="mt-2" />

            {/* The $1 test, on a first payout. Nothing else moves until they
                say it arrived — see lib/wallet.ts. */}
            {open.testSentAt && !open.testConfirmedAt ? (
              <ConfirmTestButton withdrawalId={open.id} reference={open.testReference} locale={locale} />
            ) : null}

            {open.testConfirmedAt ? (
              <p className="mt-2 text-xs text-[var(--tone-success)]">{copy.testConfirmed}</p>
            ) : null}

            <CancelWithdrawalButton withdrawalId={open.id} locale={locale} />
          </div>
        ) : (
          <div className="mt-3">
            <WithdrawForm
              availableCents={balance.availableCents}
              minimumCents={MINIMUM_WITHDRAWAL_CENTS}
              currency={balance.currency}
              preferredMethod={preferredMethod}
              locale={locale}
            />
          </div>
        )}
      </Card>

      {/* --- history --- */}
      <Card className="mt-3">
        <h2 className="text-sm font-semibold">{copy.withdrawals}</h2>

        {withdrawals.length === 0 ? (
          <div className="mt-3">
            <EmptyPanel icon="payout" title={copy.nothingWithdrawnTitle}>
              {copy.nothingWithdrawnBody(formatCents(MINIMUM_WITHDRAWAL_CENTS, balance.currency))}
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
                  {copy.requested} {withdrawal.requestedAt.toLocaleString(locale === "ar" ? "ar" : "en-GB")}
                  {withdrawal.decidedAt
                    ? ` · ${withdrawal.status === "sent" ? copy.sent : copy.closed} ${withdrawal.decidedAt.toLocaleString(locale === "ar" ? "ar" : "en-GB")}`
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
                      {withdrawal.status === "sent" ? copy.reference : copy.reason}
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
        <h2 className="text-sm font-semibold">{copy.whatsInBalance}</h2>
        <p className="mt-1 mb-3 text-xs text-[var(--muted)]">
          {copy.whatsInBalanceCaption(formatCents(REFERRAL_REWARD_CENTS, balance.currency))}
        </p>

        {earnings.length === 0 ? (
          <EmptyPanel icon="folder" title={copy.noEarningsTitle}>
            {copy.noEarningsBody(formatCents(REFERRAL_REWARD_CENTS, balance.currency))}{" "}
            <Link href="/referrals" className="underline">
              {copy.shareCode}
            </Link>{" "}
            {copy.toGetStarted}
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
                  {earning.traderName} {copy.completedSwap} ·{" "}
                  {earning.createdAt.toLocaleDateString(locale === "ar" ? "ar" : "en-GB")}
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
