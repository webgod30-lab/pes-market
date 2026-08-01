import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUserOrProblem } from "@/lib/dal";
import { loadDealForViewer } from "@/lib/deals";
import { formatCents } from "@/lib/money";
import { formatFeeBps } from "@/lib/fees";
import { DEAL_STATUS_LABEL, DEAL_STATUS_TONE } from "@/lib/deal-status";
import { revealForAdminAction } from "@/app/actions/admin-actions";
import { listMessages } from "@/lib/messages";
import { getDisputeForDeal } from "@/lib/disputes";
import { getReputation } from "@/lib/reviews";
import { listTransferCodes, CODE_EXCHANGE_STATUSES } from "@/lib/transfer-codes";
import { TransferCodePanel } from "@/components/transfer-code-panel";
import { DealTimeline } from "@/components/deal-timeline";
import { DealChat } from "@/components/deal-chat";
import { ResolveDisputeForm, WithdrawDisputeForm } from "@/components/dispute-forms";
import { ReputationLine } from "@/components/reputation";
import { AdminNav } from "@/components/admin-nav";
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
import { Badge, Card, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Deal — admin — PES Escrow" };

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
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title={deal.reference}
        description={`${deal.seller?.displayName ?? "—"} → ${deal.buyer?.displayName ?? "—"}`}
      />

      <AdminNav current="deals" />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABEL[deal.status]}</Badge>
        <Badge tone="neutral">
          {formatCents(deal.agreedPriceCents, deal.currency)} · your cut{" "}
          {formatCents(deal.feeCents, deal.currency)} ({formatFeeBps(deal.feeBps)})
        </Badge>
      </div>

      <DealTimeline status={deal.status} />

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
              revealLabel="Reveal the account details"
              note="Decrypted only for this request. Not logged, not stored anywhere else."
            />
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

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        <Link href="/admin" className="text-emerald-400 hover:underline">
          Back to the admin console
        </Link>
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-[var(--muted)]">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
