import { notFound } from "next/navigation";

import { requireUserOrProblem } from "@/lib/dal";
import { loadDealForViewer } from "@/lib/deals";
import { formatCents } from "@/lib/money";
import { DEAL_STATUS_TONE, dealStatusLabel } from "@/lib/deal-status";
import { revealCounterForAdminAction, revealForAdminAction } from "@/app/actions/admin-actions";
import { listMessages } from "@/lib/messages";
import { getDisputeForDeal } from "@/lib/disputes";
import { getReputation } from "@/lib/reviews";
import { meetsStrengthBar, MINIMUM_TEAM_STRENGTH } from "@/lib/referrals";
import { listTransferCodes, CODE_EXCHANGE_STATUSES } from "@/lib/transfer-codes";
import { TransferCodePanel } from "@/components/transfer-code-panel";
import { AccountFactList } from "@/components/trade/account-facts";
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
import { getLocale } from "@/lib/locale-server";
import { ADMIN_DEAL_DETAIL } from "@/lib/page-copy";

export const metadata = { title: "Deal — admin" };

export default async function AdminDealPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUserOrProblem(["admin"], "/admin");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const { id } = await params;
  const result = await loadDealForViewer(id, auth.user);

  if (!result) notFound();

  const { deal } = result;
  const locale = await getLocale();
  const copy = ADMIN_DEAL_DETAIL[locale];

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

  // Asked through the same function that writes the credits, so the console
  // cannot say one thing while the crediting pass does another.
  const paysPromoters = meetsStrengthBar(deal.teamStrength, deal.counterTeamStrength);

  return (
    <DashShell
      groups={adminSections({})}
      title={deal.reference}
      description={`${deal.seller?.displayName ?? "—"} → ${deal.buyer?.displayName ?? "—"}`}
    >
      <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone={DEAL_STATUS_TONE[deal.status]}>{dealStatusLabel(locale)[deal.status]}</Badge>
        {deal.tradeKind === "swap" ? (
          <Badge tone="info">{copy.swapBadge}</Badge>
        ) : (
          // A deal from the retired cash flow. The figures are shown as they
          // were actually charged at the time, not as today's rules would have
          // it — this is the record of what these two people agreed to.
          <Badge tone="neutral">
            {copy.archivedBadge(
              formatCents(deal.agreedPriceCents, deal.currency),
              formatCents(deal.feeCents, deal.currency),
              (deal.feeBps / 100).toFixed(1),
            )}
          </Badge>
        )}
      </div>

      {/* Progress and the full record together. The record is what an admin
          arbitrating a dispute actually needs — who did what, and when. */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">{copy.progress}</h2>
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
          <h2 className="mb-3 text-sm font-semibold">{copy.history}</h2>
          <TradeHistory facts={deal} />
        </Card>
      </div>

      {/* --- the case, when there is one: put it first, it is why you are here --- */}
      {dispute ? (
        <Card className="mt-6 border-red-500/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{copy.disputeTitle(dispute.reason)}</h2>
            <Badge tone={disputeIsOpen ? "danger" : "neutral"}>{dispute.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {copy.openedBy(dispute.openedBy.displayName)}{" "}
            {dispute.createdAt.toLocaleString(locale === "ar" ? "ar" : "en-GB")}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm">{dispute.description}</p>

          {dispute.resolution ? (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.yourDecision}</p>
              <p className="mt-1 whitespace-pre-line text-sm">{dispute.resolution}</p>
            </div>
          ) : null}

          {disputeIsOpen ? (
            <>
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <ResolveDisputeForm
                  dealId={deal.id}
                  buyerName={deal.buyer?.displayName ?? copy.theBuyer}
                  sellerName={deal.seller?.displayName ?? copy.theSeller}
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
        <h2 className="text-sm font-semibold">{copy.theParties}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.seller}</p>
            <p className="mt-1 text-sm font-medium">{deal.seller?.displayName ?? "—"}</p>
            {sellerReputation ? (
              <div className="mt-1">
                <ReputationLine reputation={sellerReputation} locale={locale} />
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.buyer}</p>
            <p className="mt-1 text-sm font-medium">{deal.buyer?.displayName ?? "—"}</p>
            {buyerReputation ? (
              <div className="mt-1">
                <ReputationLine reputation={buyerReputation} locale={locale} />
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="mt-3">
        <h2 className="text-sm font-semibold">{copy.sellerPromised}</h2>
        <p className="mt-2 text-sm leading-relaxed">{deal.accountSummary}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">{deal.game}</p>

        {/* The checkable half of what was promised. This is the list the admin
            works down while logged into the account. */}
        <AccountFactList facts={deal} locale={locale} />

        {/* On a swap there is a second promise to check against. */}
        {deal.tradeKind === "swap" ? (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <h3 className="text-sm font-semibold">{copy.buyerPromised}</h3>
            <p className="mt-2 text-sm leading-relaxed">
              {deal.counterAccountSummary ?? copy.notDescribed}
            </p>

            <AccountFactList
              facts={{
                platform: deal.counterPlatform,
                level: deal.counterLevel,
                teamStrength: deal.counterTeamStrength,
                epics: deal.counterEpics,
                epicPlayers: deal.counterEpicPlayers,
              }}
              locale={locale}
            />

            <p className="mt-3 text-xs text-[var(--muted)]">{copy.swapNote}</p>

            {/* Whether this deal owes the two promoters anything, stated on the
                deal rather than left to be worked out from two numbers. */}
            <p
              className={
                paysPromoters
                  ? "mt-2 text-xs text-[var(--tone-success)]"
                  : "mt-2 text-xs text-[var(--muted)]"
              }
            >
              {paysPromoters
                ? copy.creditQualifies(MINIMUM_TEAM_STRENGTH)
                : copy.creditBlocked(MINIMUM_TEAM_STRENGTH)}
            </p>
          </div>
        ) : null}
      </Card>

      {/* --- payment --- */}
      {deal.paymentSubmittedAt ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">{copy.buyerSentTitle}</h2>
          <dl className="mt-3 space-y-1.5 text-xs">
            <Row label={copy.submitted}>
              {deal.paymentSubmittedAt.toLocaleString(locale === "ar" ? "ar" : "en-GB")}
            </Row>
            {deal.paymentTxHash ? (
              <Row label={copy.transaction}>
                <span className="break-all font-mono">{deal.paymentTxHash}</span>
              </Row>
            ) : null}
            {deal.paymentReference ? (
              <Row label={copy.reference}>
                <span className="break-all">{deal.paymentReference}</span>
              </Row>
            ) : null}
          </dl>
          {deal.paymentInstructionsSnapshot ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-[var(--muted)]">
                {copy.whatTheyPaidSnapshot}
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
          <h2 className="mb-3 text-sm font-semibold">{copy.step1ConfirmPayment}</h2>
          <ConfirmPaymentButton dealId={deal.id} />
        </Card>
      ) : null}

      {deal.status === "admin_verifying" ? (
        <>
          <Card className="mt-3">
            <h2 className="text-sm font-semibold">{copy.step2CheckAccount}</h2>
            <p className="mt-2 mb-4 text-sm text-[var(--muted)]">{copy.step2Body}</p>
            <CredentialsPanel
              dealId={deal.id}
              action={revealForAdminAction}
              revealLabel={deal.tradeKind === "swap" ? copy.revealSeller : copy.revealAccount}
              note={copy.decryptNote}
            />

            {/* A swap has two accounts and both are released at once, so both
                have to be checked before either moves. */}
            {deal.tradeKind === "swap" ? (
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="mb-3 text-sm text-[var(--muted)]">{copy.swapCheckBuyerToo}</p>
                <CredentialsPanel
                  dealId={deal.id}
                  action={revealCounterForAdminAction}
                  revealLabel={copy.revealBuyer}
                  note={copy.decryptNote}
                />
              </div>
            ) : null}

            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <RecordVerificationForm dealId={deal.id} />
            </div>
          </Card>

          <Card className="mt-3">
            <h2 className="mb-3 text-sm font-semibold">{copy.step3Release}</h2>
            <ApproveDeliveryButton dealId={deal.id} />
          </Card>
        </>
      ) : null}

      {deal.verification?.lastVerifiedAt ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">{copy.yourVerificationNote}</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {deal.verification.lastVerifiedAt.toLocaleString(locale === "ar" ? "ar" : "en-GB")}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm">{deal.verification.note}</p>
        </Card>
      ) : null}

      {/* The commonest reason a claim sits there doing nothing. Read-only for you:
          the code lands in the seller's inbox, so only they can supply it. */}
      {transferCodes ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">{copy.konamiCodesTitle}</h2>
          <p className="mt-1 mb-4 text-xs text-[var(--muted)]">{copy.konamiCodesBody}</p>
          <TransferCodePanel dealId={deal.id} codes={transferCodes} role="admin" />
        </Card>
      ) : null}

      {deal.status === "completed" && !deal.payoutAt ? (
        <Card className="mt-3">
          <h2 className="mb-3 text-sm font-semibold">{copy.step4PaySeller}</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            {copy.step4Body(formatCents(deal.sellerPayoutCents, deal.currency), deal.seller?.displayName ?? "")}
          </p>
          <MarkPayoutForm
            dealId={deal.id}
            payoutLabel={formatCents(deal.sellerPayoutCents, deal.currency)}
          />
        </Card>
      ) : null}

      {deal.payoutAt ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">{copy.settled}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {copy.paidOut(deal.payoutAt.toLocaleString(locale === "ar" ? "ar" : "en-GB"))}
            {deal.payoutReference ? ` · ${copy.ref} ${deal.payoutReference}` : ""}
          </p>
        </Card>
      ) : null}

      {/* --- overrides --- */}
      {["payment_submitted", "admin_verifying", "credentials_released", "claiming", "disputed"].includes(
        deal.status,
      ) ? (
        <Card className="mt-3 border-red-500/20">
          <h2 className="mb-3 text-sm font-semibold">{copy.somethingWrong}</h2>
          <RefundButton dealId={deal.id} />
        </Card>
      ) : null}

      {deal.status === "completed" && !deal.payoutAt ? (
        <Card className="mt-3 border-red-500/20">
          <h2 className="mb-3 text-sm font-semibold">{copy.override}</h2>
          <ForceRefundForm
            dealId={deal.id}
            amountLabel={formatCents(deal.agreedPriceCents, deal.currency)}
          />
        </Card>
      ) : null}

      {PRE_PAYMENT_STATUSES.includes(deal.status) ? (
        <Card className="mt-3 border-[var(--border)]">
          <h2 className="mb-3 text-sm font-semibold">{copy.stalledDeal}</h2>
          <ForceCancelForm dealId={deal.id} />
        </Card>
      ) : null}

      {messages ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">{copy.messages}</h2>
          <p className="mt-1 mb-4 text-xs text-[var(--muted)]">{copy.messagesBody}</p>
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
