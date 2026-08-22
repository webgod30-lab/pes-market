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
import { getLocale } from "@/lib/locale-server";
import { ADMIN_WITHDRAWALS_PAGE } from "@/lib/page-copy";

export const metadata = { title: "Withdrawals — admin" };

export const dynamic = "force-dynamic";

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

  const locale = await getLocale();
  const copy = ADMIN_WITHDRAWALS_PAGE[locale];

  const STATUS_LABEL: Record<WithdrawalStatus, string> = {
    requested: copy.statusRequested,
    sent: copy.statusSent,
    rejected: copy.statusRejected,
    cancelled: copy.statusCancelled,
  };

  const METHOD_LABEL: Record<PaymentMethod, string> = {
    crypto: copy.methodCrypto,
    bank_transfer: copy.methodBankTransfer,
    card: copy.methodCard,
    gift_card: copy.methodGiftCard,
  };

  const { show } = await searchParams;
  const onlyOpen = show !== "all";

  const withdrawals = await listWithdrawalsForAdmin(onlyOpen);

  return (
    <DashShell
      groups={adminSections({ withdrawals: onlyOpen ? withdrawals.length : undefined })}
      title={copy.title}
      description={copy.description}
    >
      <FilterChips
        options={[
          { label: copy.waitingOnYou, href: "/admin/withdrawals", active: onlyOpen },
          { label: copy.everything, href: "/admin/withdrawals?show=all", active: !onlyOpen },
        ]}
      />

      {withdrawals.length === 0 ? (
        onlyOpen ? (
          <EmptyPanel icon="payout" title={copy.noPayoutsWaitingTitle} tone="positive">
            {copy.noPayoutsWaitingBody}
          </EmptyPanel>
        ) : (
          <EmptyPanel icon="payout" title={copy.noPayoutsYetTitle}>
            {copy.noPayoutsYetBody}
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
                        href={`/u/${withdrawal.promoter.id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        {withdrawal.promoter.displayName}
                      </Link>{" "}
                      <span className="text-[var(--muted)]">· {withdrawal.promoter.email}</span>
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

                {/* The promoter's position after this request. Negative means a
                    completed deal was reversed after they had taken the money
                    out, and paying this would hand over money they no longer
                    have a claim to. */}
                {withdrawal.promoterNetCents < 0 ? (
                  <Alert tone="danger" className="mt-3">
                    {copy.negativeBalance(formatCents(withdrawal.promoterNetCents, withdrawal.currency))}
                  </Alert>
                ) : null}

                {/* Not a rule, and nothing is blocked on it. The programme pays
                    $2 a deal and takes no commission to fund it, so one account
                    generating a promoter's whole balance is worth a look before
                    the transfer goes out. 60% is a prompt, not a threshold. */}
                {withdrawal.topTraderShare >= 0.6 && withdrawal.status === "requested" ? (
                  <Alert tone="warning" className="mt-3">
                    {copy.concentrationWarning(Math.round(withdrawal.topTraderShare * 100))}
                  </Alert>
                ) : null}

                <div className="mt-3">
                  <Overline>{copy.sendItTo}</Overline>
                  {/* One labelled row per field, so each value can be copied on
                      its own instead of being picked out of a paragraph while
                      typing a transfer. */}
                  <DetailList rows={destinationFields(withdrawal)} className="mt-1.5" />
                </div>

                <p className="mt-2 text-xs text-[var(--muted)]">
                  {copy.requested} {withdrawal.requestedAt.toLocaleString(locale === "ar" ? "ar" : "en-GB")}
                  {withdrawal.decidedAt
                    ? ` · ${copy.closed} ${withdrawal.decidedAt.toLocaleString(locale === "ar" ? "ar" : "en-GB")}`
                    : ""}
                </p>

                {withdrawal.note ? (
                  <p className="mt-2 text-sm">
                    <span className="text-[var(--muted)]">
                      {withdrawal.status === "sent" ? copy.reference : copy.reason}
                    </span>
                    <span className="break-all font-mono text-xs">{withdrawal.note}</span>
                  </p>
                ) : null}

                {withdrawal.status === "requested" ? (
                  <WithdrawalDecision
                    withdrawalId={withdrawal.id}
                    amountLabel={formatCents(withdrawal.amountCents, withdrawal.currency)}
                    promoterName={withdrawal.promoter.displayName}
                    needsTest={withdrawal.needsTest}
                    testSentAt={withdrawal.testSentAt}
                    testConfirmedAt={withdrawal.testConfirmedAt}
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
