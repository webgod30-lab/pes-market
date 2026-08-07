import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import {
  destinationFields,
  getBalance,
  listEarnings,
  listPending,
  listWithdrawals,
  MINIMUM_WITHDRAWAL_CENTS,
  WITHDRAWAL_TONE,
} from "@/lib/wallet";
import { formatCents } from "@/lib/money";
import { WithdrawForm, CancelWithdrawalButton } from "@/components/withdraw-form";
import { traderSections } from "@/components/dashboard/dash-nav";
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

  const [balance, earnings, pending, withdrawals] = await Promise.all([
    getBalance(user.id),
    listEarnings(user.id),
    listPending(user.id),
    listWithdrawals(user.id),
  ]);

  const open = withdrawals.find((w) => w.status === "requested");

  return (
    <DashShell
      groups={traderSections({})}
      title="Your balance"
      description="What you have earned from settled deals, and what you have taken out."
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
            <dt className="text-[var(--muted)]">Earned from settled deals</dt>
            <dd className="tabular-nums">{formatCents(balance.earnedCents, balance.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Requested or already sent</dt>
            <dd className="tabular-nums">−{formatCents(balance.committedCents, balance.currency)}</dd>
          </div>
        </dl>

        {/* Money that has arrived but is not yours yet. Shown next to the
            available figure rather than further down the page: the question
            this answers — "has the buyer actually paid?" — is the one a seller
            opens this page to ask, right after handing over an account. */}
        {balance.pendingCents > 0 || balance.frozenCents > 0 ? (
          <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--tone-info-border)] bg-[var(--tone-info-bg)] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-overline uppercase text-[var(--tone-info)]">Held for you</p>
              <p className="text-lg font-semibold tabular-nums text-[var(--tone-info)]">
                {formatCents(balance.pendingCents + balance.frozenCents, balance.currency)}
              </p>
            </div>

            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              The buyer has paid and the admin is holding it. It moves into your balance — and
              becomes withdrawable — once the buyer confirms they have the account.
            </p>

            {balance.frozenCents > 0 ? (
              <p className="mt-2 text-xs text-[var(--tone-danger)]">
                {formatCents(balance.frozenCents, balance.currency)} of that is frozen by a dispute
                and may be refunded to the buyer instead.
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Only reachable if a settled deal was reversed after the money went
            out. Saying so plainly beats showing a zero and no explanation. */}
        {balance.netCents < 0 ? (
          <Alert tone="danger" className="mt-4">
            Your balance is {formatCents(balance.netCents, balance.currency)}. A deal was reversed
            after you had withdrawn the money for it. Earnings from your next deals go towards
            clearing that before anything can be withdrawn again.
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
            <CancelWithdrawalButton withdrawalId={open.id} />
          </div>
        ) : (
          <div className="mt-3">
            <WithdrawForm
              availableCents={balance.availableCents}
              minimumCents={MINIMUM_WITHDRAWAL_CENTS}
              currency={balance.currency}
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
              Once a deal you sold settles, its payout lands in the balance above and you can
              request it here.
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

      {/* --- money on the way, itemised --- */}
      {pending.length > 0 ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">On the way</h2>
          <p className="mb-3 mt-1 text-xs text-[var(--muted)]">
            Paid by the buyer and held by the admin. Each one becomes withdrawable when that deal
            completes.
          </p>

          <ul className="space-y-2">
            {pending.map((row) => (
              <li key={row.dealId}>
                <Link
                  href={`/deals/${row.dealId}`}
                  className="block rounded-lg border border-[var(--border)] p-3 transition-colors hover:border-[var(--accent)]/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs">{row.reference}</span>
                    <span className="text-sm font-medium tabular-nums text-[var(--tone-info)]">
                      {formatCents(row.amountCents, row.currency)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                    {row.accountSummary}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs">
                    <Badge tone={row.status === "disputed" ? "danger" : "info"}>
                      {row.waitingOn}
                    </Badge>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* --- where the money came from --- */}
      <Card className="mt-3">
        <h2 className="text-sm font-semibold">What is in the balance</h2>
        <p className="mt-1 mb-3 text-xs text-[var(--muted)]">
          Every settled deal you sold, and what it paid after the fee. This is the balance above,
          itemised — so you can check it rather than trust it.
        </p>

        {earnings.length === 0 ? (
          <EmptyPanel icon="folder" title="No settled sales yet">
            A deal counts towards your balance only after the buyer has confirmed they have the
            account.
          </EmptyPanel>
        ) : (
          <ul className="space-y-2">
            {earnings.map((earning) => (
              <li key={earning.dealId}>
                <Link
                  href={`/deals/${earning.dealId}`}
                  className="block rounded-lg border border-[var(--border)] p-3 transition-colors hover:border-emerald-500/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs">{earning.reference}</span>
                    <span className="text-sm font-medium tabular-nums text-[var(--tone-success)]">
                      +{formatCents(earning.amountCents, earning.currency)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                    {earning.accountSummary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      </div>
    </DashShell>
  );
}
