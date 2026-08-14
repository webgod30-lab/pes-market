import { notFound } from "next/navigation";

import { requireUserOrProblem } from "@/lib/dal";
import { loadDealForViewer } from "@/lib/deals";
import { formatCents } from "@/lib/money";
import { DEAL_STATUS_LABEL, DEAL_STATUS_TONE } from "@/lib/deal-status";
import { revealCounterForAdminAction, revealForAdminAction } from "@/app/actions/admin-actions";
import { listMessages } from "@/lib/messages";
import { getDisputeForDeal } from "@/lib/disputes";
import { getReputation } from "@/lib/reviews";
import { listTransferCodes, CODE_EXCHANGE_STATUSES } from "@/lib/transfer-codes";
import { TransferCodePanel } from "@/components/transfer-code-panel";
import { DealTimeline } from "@/components/trade/timeline";
import { TradeHistory } from "@/components/trade/history";
import { DealChat } from "@/components/deal-chat";
import { ResolveDisputeForm, WithdrawDisputeForm } from "@/components/dispute-forms";
import { ReputationLine } from "@/components/reputation";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { ForceCancelForm, ForceRefundForm } from "@/components/admin-force-actions";
import { PRE_PAYMENT_STATUSES } from "@/lib/deal-status";
import { CredentialsPanel } from "@/components/credentials-panel";
import {
  ApproveDeliveryButton,
  ConfirmPaymentButton,
  MarkPayoutForm,
  RecordVerificationForm,
  RefundButton,
} from "@/components/admin-deal-actions";
import { Badge, Card, SetupProblem } from "@/components/ui";

export const metadata = { title: "Deal — admin" };

export default async function AdminDealPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUserOrProblem(["admin"], "/admin");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const { id } = await params;
  const result = await loadDealForViewer(id, auth.user);

  if (!result) notFound();

  const { deal } = result;

  const [messages, dispute, sellerReputation, buyerReputation, transferCodes] = await Promise.all([
    listMessages(deal.id, auth.user),
    getDisputeForDeal(deal.id),
    deal.seller ? getReputation(deal.seller.id) : Promise.resolve(null),
    deal.buyer ? getReputation(deal.buyer.id) : Promise.resolve(null),
    CODE_EXCHANGE_STATUSES.includes(deal.status)
      ? listTransferCodes(deal.id, auth.user)
      : Promise.resolve(null),
  ]);

  const disputeIsOpen = dispute?.status === "open" || dispute?.status === "under_review";

  return (
    <DashShell
      groups={adminSections({})}
      title={deal.reference}
      description={`${deal.seller?.displayName ?? "—"} → ${deal.buyer?.displayName ?? "—"}`}
    >
      <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABEL[deal.status]}</Badge>
        {deal.tradeKind === "swap" ? (
          <Badge tone="info">account for account · no money, no fee</Badge>
        ) : (
          // A deal from the retired cash flow. The figures are shown as they
          // were actually charged at the time, not as today's rules would have
          // it — this is the record of what these two people agreed to.
          <Badge tone="neutral">
            archived cash deal · {formatCents(deal.agreedPriceCents, deal.currency)} · cut{" "}
            {formatCents(deal.feeCents, deal.currency)} ({(deal.feeBps / 100).toFixed(1)}%)
          </Badge>
        )}
      </div>

      {/* Progress and the full record together. The record is what an admin
          arbitrating a dispute actually needs — who did what, and when. */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Progress</h2>
          <DealTimeline
            status={deal.status}
            tradeKind={deal.tradeKind}
            stamps={{
              createdAt: deal.createdAt,
              depositedAt: deal.credentialsUpdatedAt,
              paymentConfirmedAt: deal.paymentConfirmedAt,
              credentialsReleasedAt: deal.credentialsReleasedAt,
              completedAt: deal.completedAt,
            }}
          />
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold">History</h2>
          <TradeHistory facts={deal} />
        </Card>
      </div>

      {/* --- the case, when there is one: put it first, it is why you are here --- */}
      {dispute ? (
        <Card className="mt-6 border-red-500/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Dispute: {dispute.reason}</h2>
            <Badge tone={disputeIsOpen ? "danger" : "neutral"}>{dispute.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Opened by {dispute.openedBy.displayName} on{" "}
            {dispute.createdAt.toLocaleString("en-GB")}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm">{dispute.description}</p>

          {dispute.resolution ? (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Your decision</p>
              <p className="mt-1 whitespace-pre-line text-sm">{dispute.resolution}</p>
            </div>
          ) : null}

          {disputeIsOpen ? (
            <>
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <ResolveDisputeForm
                  dealId={deal.id}
                  buyerName={deal.buyer?.displayName ?? "the buyer"}
                  sellerName={deal.seller?.displayName ?? "the seller"}
                  refundLabel={formatCents(deal.agreedPriceCents, deal.currency)}
                  payoutLabel={formatCents(deal.sellerPayoutCents, deal.currency)}
                />
              </div>
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <WithdrawDisputeForm dealId={deal.id} />
              </div>
            </>
          ) : null}
        </Card>
      ) : null}

      {/* --- who these two are --- */}
      <Card className="mt-3">
        <h2 className="text-sm font-semibold">The parties</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Seller</p>
            <p className="mt-1 text-sm font-medium">{deal.seller?.displayName ?? "—"}</p>
            {sellerReputation ? (
              <div className="mt-1">
                <ReputationLine reputation={sellerReputation} />
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Buyer</p>
            <p className="mt-1 text-sm font-medium">{deal.buyer?.displayName ?? "—"}</p>
            {buyerReputation ? (
              <div className="mt-1">
                <ReputationLine reputation={buyerReputation} />
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="mt-3">
        <h2 className="text-sm font-semibold">What the seller promised</h2>
        <p className="mt-2 text-sm leading-relaxed">{deal.accountSummary}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {deal.game}
          {deal.platform ? ` · ${deal.platform}` : ""}
          {deal.level !== null ? ` · level ${deal.level}` : ""}
        </p>

        {/* On a swap there is a second promise to check against. */}
        {deal.tradeKind === "swap" ? (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <h3 className="text-sm font-semibold">What the buyer promised</h3>
            <p className="mt-2 text-sm leading-relaxed">
              {deal.counterAccountSummary ?? "Not described."}
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Account-for-account swap — no money, no fee. Both accounts release together.
            </p>
          </div>
        ) : null}
      </Card>

      {/* --- payment --- */}
      {deal.paymentSubmittedAt ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">What the buyer says they sent</h2>
          <dl className="mt-3 space-y-1.5 text-xs">
            <Row label="Submitted">{deal.paymentSubmittedAt.toLocaleString("en-GB")}</Row>
            {deal.paymentTxHash ? (
              <Row label="Transaction">
                <span className="break-all font-mono">{deal.paymentTxHash}</span>
              </Row>
            ) : null}
            {deal.paymentReference ? (
              <Row label="Reference">
                <span className="break-all">{deal.paymentReference}</span>
              </Row>
            ) : null}
          </dl>
          {deal.paymentInstructionsSnapshot ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-[var(--muted)]">
                What they were told to pay (frozen at submission)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-[var(--surface-2)] p-3 text-xs">
                {deal.paymentInstructionsSnapshot}
              </pre>
            </details>
          ) : null}
        </Card>
      ) : null}

      {/* --- the actions, in the order they happen --- */}
      {deal.status === "payment_submitted" ? (
        <Card className="mt-3">
          <h2 className="mb-3 text-sm font-semibold">1. Confirm the money arrived</h2>
          <ConfirmPaymentButton dealId={deal.id} />
        </Card>
      ) : null}

      {deal.status === "admin_verifying" ? (
        <>
          <Card className="mt-3">
            <h2 className="text-sm font-semibold">2. Check the account works</h2>
            <p className="mt-2 mb-4 text-sm text-[var(--muted)]">
              Log in and confirm it matches the description above. This is the only protection the
              buyer has.
            </p>
            <CredentialsPanel
              dealId={deal.id}
              action={revealForAdminAction}
              revealLabel={
                deal.tradeKind === "swap"
                  ? "Reveal the seller's account"
                  : "Reveal the account details"
              }
              note="Decrypted only for this request. Not logged, not stored anywhere else."
            />

            {/* A swap has two accounts and both are released at once, so both
                have to be checked before either moves. */}
            {deal.tradeKind === "swap" ? (
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="mb-3 text-sm text-[var(--muted)]">
                  This is a swap. Check the buyer&apos;s account too — both are handed over together.
                </p>
                <CredentialsPanel
                  dealId={deal.id}
                  action={revealCounterForAdminAction}
                  revealLabel="Reveal the buyer's account"
                  note="Decrypted only for this request. Not logged, not stored anywhere else."
                />
              </div>
            ) : null}

            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <RecordVerificationForm dealId={deal.id} />
            </div>
          </Card>

          <Card className="mt-3">
            <h2 className="mb-3 text-sm font-semibold">3. Release it to the buyer</h2>
            <ApproveDeliveryButton dealId={deal.id} />
          </Card>
        </>
      ) : null}

      {deal.verification?.lastVerifiedAt ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">Your verification note</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {deal.verification.lastVerifiedAt.toLocaleString("en-GB")}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm">{deal.verification.note}</p>
        </Card>
      ) : null}

      {/* The commonest reason a claim sits there doing nothing. Read-only for you:
          the code lands in the seller's inbox, so only they can supply it. */}
      {transferCodes ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">Konami verification codes</h2>
          <p className="mt-1 mb-4 text-xs text-[var(--muted)]">
            The buyer cannot finish the transfer without these, and only the seller receives them.
            If one has gone unanswered, chase the seller — do not invent a code.
          </p>
          <TransferCodePanel dealId={deal.id} codes={transferCodes} role="admin" />
        </Card>
      ) : null}

      {deal.status === "completed" && !deal.payoutAt ? (
        <Card className="mt-3">
          <h2 className="mb-3 text-sm font-semibold">4. Pay the seller</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            The buyer confirmed. Send {formatCents(deal.sellerPayoutCents, deal.currency)} to{" "}
            {deal.seller?.displayName}, then record it.
          </p>
          <MarkPayoutForm
            dealId={deal.id}
            payoutLabel={formatCents(deal.sellerPayoutCents, deal.currency)}
          />
        </Card>
      ) : null}

      {deal.payoutAt ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">Settled</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Paid out {deal.payoutAt.toLocaleString("en-GB")}
            {deal.payoutReference ? ` · ref ${deal.payoutReference}` : ""}
          </p>
        </Card>
      ) : null}

      {/* --- overrides --- */}
      {["payment_submitted", "admin_verifying", "credentials_released", "claiming", "disputed"].includes(
        deal.status,
      ) ? (
        <Card className="mt-3 border-red-500/20">
          <h2 className="mb-3 text-sm font-semibold">Something went wrong?</h2>
          <RefundButton dealId={deal.id} />
        </Card>
      ) : null}

      {deal.status === "completed" && !deal.payoutAt ? (
        <Card className="mt-3 border-red-500/20">
          <h2 className="mb-3 text-sm font-semibold">Override</h2>
          <ForceRefundForm
            dealId={deal.id}
            amountLabel={formatCents(deal.agreedPriceCents, deal.currency)}
          />
        </Card>
      ) : null}

      {PRE_PAYMENT_STATUSES.includes(deal.status) ? (
        <Card className="mt-3 border-[var(--border)]">
          <h2 className="mb-3 text-sm font-semibold">Stalled deal</h2>
          <ForceCancelForm dealId={deal.id} />
        </Card>
      ) : null}

      {messages ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">Messages</h2>
          <p className="mt-1 mb-4 text-xs text-[var(--muted)]">
            Everything the two parties have said, plus your internal notes. Notes marked internal are
            never shown to them.
          </p>
          <DealChat dealId={deal.id} messages={messages} canPostAdminNote />
        </Card>
      ) : null}

      </div>
    </DashShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-[var(--muted)]">{label}</dt>
      <dd className="text-end">{children}</dd>
    </div>
  );
}
