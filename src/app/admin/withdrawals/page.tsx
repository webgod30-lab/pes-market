import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listWithdrawalsForAdmin } from "@/lib/wallet";
import { formatCents } from "@/lib/money";
import { AdminNav } from "@/components/admin-nav";
import { WithdrawalDecision } from "@/components/admin-withdrawal-actions";
import { Badge, Card, EmptyState, PageHeading, SetupProblem, type Tone } from "@/components/ui";
import type { PaymentMethod, WithdrawalStatus } from "@/generated/prisma/client";

export const metadata = { title: "Withdrawals — admin — PES Escrow" };

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  requested: "Waiting on you",
  sent: "Sent",
  rejected: "Refused",
  cancelled: "Cancelled by seller",
};

const STATUS_TONE: Record<WithdrawalStatus, Tone> = {
  requested: "warning",
  sent: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  crypto: "Crypto",
  bank_transfer: "Bank transfer",
  card: "Card / wallet",
};

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const auth = await requireUserOrProblem(["admin"], "/admin/withdrawals");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const { show } = await searchParams;
  const onlyOpen = show !== "all";

  const withdrawals = await listWithdrawalsForAdmin(onlyOpen);

  return (
    <div>
      <PageHeading
        title="Withdrawals"
        description="Sellers taking their balance off the site. You send the money by hand, then record it here."
      />

      <AdminNav current="withdrawals" />

      <div className="mb-4 flex flex-wrap gap-1">
        <Link
          href="/admin/withdrawals"
          className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
            onlyOpen
              ? "bg-emerald-500/10 font-medium text-[var(--tone-success)]"
              : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
          }`}
        >
          Waiting on you
        </Link>
        <Link
          href="/admin/withdrawals?show=all"
          className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
            onlyOpen
              ? "text-[var(--muted)] hover:bg-[var(--surface-2)]"
              : "bg-emerald-500/10 font-medium text-[var(--tone-success)]"
          }`}
        >
          Everything
        </Link>
      </div>

      {withdrawals.length === 0 ? (
        <EmptyState>
          {onlyOpen ? "No withdrawals waiting." : "No withdrawals have been requested yet."}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <li key={withdrawal.id}>
              <Card className="ring-hairline">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-2xl font-semibold tabular-nums">
                      {formatCents(withdrawal.amountCents, withdrawal.currency)}
                    </p>
                    <p className="mt-1 text-sm">
                      <Link
                        href={`/u/${withdrawal.seller.id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        {withdrawal.seller.displayName}
                      </Link>{" "}
                      <span className="text-[var(--muted)]">· {withdrawal.seller.email}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone={STATUS_TONE[withdrawal.status]}>
                      {STATUS_LABEL[withdrawal.status]}
                    </Badge>
                    <span className="text-xs text-[var(--muted)]">
                      {METHOD_LABEL[withdrawal.method]}
                    </span>
                  </div>
                </div>

                {/* The seller's position after this request. Negative means a
                    settled deal was reversed after they had taken the money
                    out, and paying this would hand over money they no longer
                    have a claim to. */}
                {withdrawal.sellerNetCents < 0 ? (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-[var(--tone-danger)]">
                    This seller&apos;s balance is{" "}
                    {formatCents(withdrawal.sellerNetCents, withdrawal.currency)} — a deal of theirs
                    was reversed after they withdrew. Do not send this without checking why.
                  </p>
                ) : null}

                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Send it to</p>
                  <p className="mt-1 break-all rounded-lg bg-[var(--surface-2)] px-3 py-2.5 font-mono text-sm">
                    {withdrawal.destination}
                  </p>
                </div>

                <p className="mt-2 text-xs text-[var(--muted)]">
                  Requested {withdrawal.requestedAt.toLocaleString("en-GB")}
                  {withdrawal.decidedAt
                    ? ` · closed ${withdrawal.decidedAt.toLocaleString("en-GB")}`
                    : ""}
                </p>

                {withdrawal.note ? (
                  <p className="mt-2 text-sm">
                    <span className="text-[var(--muted)]">
                      {withdrawal.status === "sent" ? "Reference: " : "Reason: "}
                    </span>
                    <span className="break-all font-mono text-xs">{withdrawal.note}</span>
                  </p>
                ) : null}

                {withdrawal.status === "requested" ? (
                  <WithdrawalDecision
                    withdrawalId={withdrawal.id}
                    amountLabel={formatCents(withdrawal.amountCents, withdrawal.currency)}
                    sellerName={withdrawal.seller.displayName}
                  />
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
