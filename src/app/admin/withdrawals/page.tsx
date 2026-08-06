import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { destinationFields, listWithdrawalsForAdmin, WITHDRAWAL_TONE } from "@/lib/wallet";
import { formatCents } from "@/lib/money";
import { WithdrawalDecision } from "@/components/admin-withdrawal-actions";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { FilterChips } from "@/components/dashboard/filter-chips";
import { Alert, Badge, Card, DetailList, Overline, SetupProblem } from "@/components/ui";
import type { PaymentMethod, WithdrawalStatus } from "@/generated/prisma/client";

export const metadata = { title: "Withdrawals — admin" };

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  requested: "Waiting on you",
  sent: "Sent",
  rejected: "Refused",
  cancelled: "Cancelled by seller",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  crypto: "Crypto",
  bank_transfer: "Bank transfer",
  card: "Card / wallet",
};

/**
 * Deliberately cards, not a table.
 *
 * Every other admin list on the console became a DataTable, because they are
 * uniform records being scanned. These are not: each one carries a labelled
 * destination block the admin is copying field by field into a bank, plus a
 * decision form. Flattening that into cells would put an IBAN and an account
 * name in the same column and make it easy to send money to the wrong place.
 */
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
    <DashShell
      groups={adminSections({ withdrawals: onlyOpen ? withdrawals.length : undefined })}
      title="Withdrawals"
      description="Sellers taking their balance off the site. You send the money by hand, then record it here."
    >
      <FilterChips
        options={[
          { label: "Waiting on you", href: "/admin/withdrawals", active: onlyOpen },
          { label: "Everything", href: "/admin/withdrawals?show=all", active: !onlyOpen },
        ]}
      />

      {withdrawals.length === 0 ? (
        onlyOpen ? (
          <EmptyPanel icon="payout" title="No withdrawals waiting" tone="positive">
            Nobody is owed a transfer right now. Requested money stays reserved against the
            seller&apos;s balance until you send or refuse it, so an empty list means nothing is
            held up.
          </EmptyPanel>
        ) : (
          <EmptyPanel icon="payout" title="No withdrawals requested yet">
            Sellers can request one as soon as a deal completes and their balance clears.
          </EmptyPanel>
        )
      ) : (
        <ul className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <li key={withdrawal.id}>
              <Card elevation="raised">
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
                    <Badge tone={WITHDRAWAL_TONE[withdrawal.status]}>
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
                  <Alert tone="danger" className="mt-3">
                    This seller&apos;s balance is{" "}
                    {formatCents(withdrawal.sellerNetCents, withdrawal.currency)} — a deal of theirs
                    was reversed after they withdrew. Do not send this without checking why.
                  </Alert>
                ) : null}

                <div className="mt-3">
                  <Overline>Send it to</Overline>
                  {/* One labelled row per field, so each value can be copied on
                      its own instead of being picked out of a paragraph while
                      typing a transfer. */}
                  <DetailList rows={destinationFields(withdrawal)} className="mt-1.5" />
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
    </DashShell>
  );
}
