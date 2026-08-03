import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import {
  destinationFields,
  getBalance,
  listEarnings,
  listWithdrawals,
  MINIMUM_WITHDRAWAL_CENTS,
} from "@/lib/wallet";
import { formatCents } from "@/lib/money";
import { WithdrawForm, CancelWithdrawalButton } from "@/components/withdraw-form";
import { Badge, Card, EmptyState, PageHeading, SetupProblem, type Tone } from "@/components/ui";
import type { WithdrawalStatus } from "@/generated/prisma/client";

export const metadata = { title: "Your balance — PES Escrow" };

// Reads the signed-in user's money, so it can never be prerendered or cached.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  requested: "Waiting to be sent",
  sent: "Sent",
  rejected: "Refused",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<WithdrawalStatus, Tone> = {
  requested: "warning",
  sent: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export default async function WalletPage() {
  const auth = await requireUserOrProblem(null, "/wallet");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const user = auth.user;

  const [balance, earnings, withdrawals] = await Promise.all([
    getBalance(user.id),
    listEarnings(user.id),
    listWithdrawals(user.id),
  ]);

  const open = withdrawals.find((w) => w.status === "requested");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title="Your balance"
        description="What you have earned from settled deals, and what you have taken out."
      />

      {/* --- the number, and what it is made of --- */}
      <Card className="ring-hairline">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Available to withdraw</p>
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

        {/* Only reachable if a settled deal was reversed after the money went
            out. Saying so plainly beats showing a zero and no explanation. */}
        {balance.netCents < 0 ? (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-[var(--tone-danger)]">
            Your balance is {formatCents(balance.netCents, balance.currency)}. A deal was reversed
            after you had withdrawn the money for it. Earnings from your next deals go towards
            clearing that before anything can be withdrawn again.
          </p>
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
            <dl className="mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)]">
              {destinationFields(open).map((field) => (
                <div
                  key={field.label}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-[var(--surface-2)] px-3 py-2"
                >
                  <dt className="w-40 shrink-0 text-xs text-[var(--muted)]">{field.label}</dt>
                  <dd
                    className={`min-w-0 flex-1 break-all text-sm ${field.mono ? "font-mono" : ""}`}
                  >
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
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
            <EmptyState>Nothing withdrawn yet.</EmptyState>
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
                  <Badge tone={STATUS_TONE[withdrawal.status]}>
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
          Every settled deal you sold, and what it paid after the fee. This is the balance above,
          itemised — so you can check it rather than trust it.
        </p>

        {earnings.length === 0 ? (
          <EmptyState>No settled sales yet.</EmptyState>
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

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          Back to your deals
        </Link>
      </p>
    </div>
  );
}
