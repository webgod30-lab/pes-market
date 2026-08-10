import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUserOrProblem } from "@/lib/dal";
import { loadDealForViewer, type DealView, type DealViewerRole } from "@/lib/deals";
import { listActivePaymentMethods, type PaymentMethodView } from "@/lib/payment-methods";
import { formatCents } from "@/lib/money";
import { formatFeeBps } from "@/lib/fees";
import { DEAL_STATUS_LABEL, PRE_PAYMENT_STATUSES } from "@/lib/deal-status";
import { DealTimeline } from "@/components/trade/timeline";
import { TradeHistory } from "@/components/trade/history";
import { StatusBadge, TurnBadge } from "@/components/trade/status-badge";
import { DepositCredentialsForm } from "@/components/deposit-credentials-form";
import { InviteShare } from "@/components/invite-share";
import { CancelDealForm } from "@/components/cancel-deal-form";
import { PayDealForm } from "@/components/pay-deal-form";
import { CredentialsPanel } from "@/components/credentials-panel";
import { ConfirmClaimForm } from "@/components/confirm-claim-form";
import { revealForBuyerAction } from "@/app/actions/payment-actions";
import { listMessages } from "@/lib/messages";
import { listTransferCodes, CODE_EXCHANGE_STATUSES } from "@/lib/transfer-codes";
import { TransferCodePanel } from "@/components/transfer-code-panel";
import { getDisputeForDeal, DISPUTABLE_STATUSES } from "@/lib/disputes";
import { getReputation, getReviewsForDeal, hasReviewed } from "@/lib/reviews";
import { DealChat } from "@/components/deal-chat";
import { OpenDisputeForm, WithdrawDisputeForm } from "@/components/dispute-forms";
import { ReviewForm } from "@/components/review-form";
import { ReputationLine, Stars } from "@/components/reputation";
import { Badge, Card, SetupProblem } from "@/components/ui";

export const metadata = { title: "Deal" };

export default async function DealPage({
  params,
  searchParams,
}: {
  // Next.js 16: both are Promises.
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    joined?: string;
    deposited?: string;
    cancelled?: string;
    paid?: string;
    confirmed?: string;
  }>;
}) {
  const auth = await requireUserOrProblem(null);

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const { id } = await params;
  const flags = await searchParams;

  const result = await loadDealForViewer(id, auth.user);

  // Not a party to this deal (and not the admin). 404 rather than "forbidden",
  // so an outsider cannot confirm the deal exists.
  if (!result) notFound();

  const { deal, role } = result;
  const isParty = role === "seller" || role === "buyer";
  const isSwapDeal = deal.tradeKind === "swap";

  // Only needed when the buyer is actually about to pay.
  const paymentMethods =
    role === "buyer" && deal.status === "awaiting_payment" ? await listActivePaymentMethods() : [];

  // Who the reader is dealing with, and how they have behaved before.
  const counterparty = role === "seller" ? deal.buyer : deal.seller;

  const [messages, dispute, reviews, counterpartyReputation, alreadyReviewed, transferCodes] = await Promise.all([
    listMessages(deal.id, auth.user),
    getDisputeForDeal(deal.id),
    deal.status === "completed" ? getReviewsForDeal(deal.id) : Promise.resolve([]),
    counterparty ? getReputation(counterparty.id) : Promise.resolve(null),
    deal.status === "completed" && isParty
      ? hasReviewed(deal.id, auth.user.id)
      : Promise.resolve(true),
    CODE_EXCHANGE_STATUSES.includes(deal.status)
      ? listTransferCodes(deal.id, auth.user)
      : Promise.resolve(null),
  ]);

  const canDispute = isParty && DISPUTABLE_STATUSES.includes(deal.status);
  // Both sides review each other now, so this is no longer buyer-only.
  const canReview = isParty && deal.status === "completed" && !alreadyReviewed;

  return (
    <div className="mx-auto max-w-3xl">
      {flags.created ? (
        <Banner tone="success">
          Deal created. Send the invite code below to the other person — nothing happens until they
          join.
        </Banner>
      ) : null}
      {flags.joined ? <Banner tone="success">You have joined this deal.</Banner> : null}
      {flags.deposited ? (
        <Banner tone="success">
          Account details stored, encrypted. The buyer cannot see them until the admin approves
          delivery.
        </Banner>
      ) : null}
      {flags.cancelled ? <Banner tone="neutral">This deal has been cancelled.</Banner> : null}
      {flags.paid ? (
        <Banner tone="success">
          Payment submitted. The admin will check it arrived, then verify the account before
          releasing anything.
        </Banner>
      ) : null}
      {flags.confirmed ? (
        <Banner tone="success">Confirmed. The deal is settled and the seller gets paid.</Banner>
      ) : null}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{deal.reference}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Opened {deal.createdAt.toLocaleDateString("en-GB")}
            {deal.seller && deal.buyer ? (
              <>
                {" · "}
                {deal.seller.displayName} → {deal.buyer.displayName}
              </>
            ) : null}
          </p>
          {counterparty && counterpartyReputation ? (
            <div className="mt-1.5">
              <ReputationLine reputation={counterpartyReputation} name={counterparty.displayName} />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isParty ? <Badge tone={role === "seller" ? "info" : "success"}>you are the {role}</Badge> : null}
          {role === "admin" ? <Badge tone="warning">admin view</Badge> : null}
          <StatusBadge status={deal.status} side={isParty ? role : undefined} tradeKind={deal.tradeKind} />
          {isParty ? <TurnBadge status={deal.status} side={role} tradeKind={deal.tradeKind} /> : null}
        </div>
      </div>

      {/* Where it has got to, and everything that has happened, side by side.
          They answer different questions — see the note in trade/history.tsx —
          and on a phone they stack in that order, which is also the order of
          how urgent they are. */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Progress</h2>
          <DealTimeline
            status={deal.status}
            tradeKind={deal.tradeKind}
            // DealView deliberately does not expose when the invite was
            // accepted, so that step shows no date rather than a guessed one.
            // The deposit is dated from credentialsUpdatedAt, which is the last
            // time the seller touched the account details.
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

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold">
            {isSwapDeal ? "The seller's account" : "What is being traded"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{deal.accountSummary}</p>
          <p className="mt-3 text-xs text-[var(--muted)]">
            {deal.game}
            {deal.platform ? ` · ${deal.platform}` : ""}
            {deal.level !== null ? ` · level ${deal.level}` : ""}
          </p>
        </Card>

        {isSwapDeal ? (
          // A swap has two descriptions and no money, so the panel that would
          // show the split shows the other half of the trade instead.
          <Card>
            <h2 className="text-sm font-semibold">The buyer&apos;s account</h2>
            <p className="mt-2 text-sm leading-relaxed">
              {deal.counterAccountSummary ?? "Not described."}
            </p>
            <p className="mt-3 text-xs text-[var(--muted)]">
              No money changes hands. Both accounts are held and released together, so neither side
              can take one and walk away. No fee.
            </p>
          </Card>
        ) : (
        <Card>
          <h2 className="text-sm font-semibold">The money</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Buyer pays</dt>
              <dd className="font-medium">{formatCents(deal.agreedPriceCents, deal.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Escrow fee ({formatFeeBps(deal.feeBps)})</dt>
              <dd>−{formatCents(deal.feeCents, deal.currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1.5">
              <dt className="text-[var(--muted)]">Seller receives</dt>
              <dd className="font-semibold text-[var(--accent)]">
                {formatCents(deal.sellerPayoutCents, deal.currency)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Locked when the deal was opened. Changing the fee later does not affect it.
          </p>
        </Card>
        )}
      </div>

      <div className="mt-3">
        <NextStep deal={deal} role={role} paymentMethods={paymentMethods} />
      </div>

      {/* --- publisher verification codes, during the handover --- */}
      {transferCodes ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">Konami verification codes</h2>
          <p className="mt-1 mb-4 text-xs text-[var(--muted)]">
            Changing the email on the account makes Konami send a code to the address still on file —
            the seller&apos;s. The buyer cannot finish the transfer without it, so it gets passed
            here rather than in chat, where it is on the record.
          </p>
          <TransferCodePanel dealId={deal.id} codes={transferCodes} role={role} />
        </Card>
      ) : null}

      {/* --- the dispute, if there is one --- */}
      {dispute ? (
        <Card className="mt-3 border-red-500/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Dispute: {dispute.reason}</h2>
            <Badge
              tone={
                dispute.status === "open" || dispute.status === "under_review"
                  ? "danger"
                  : "neutral"
              }
            >
              {DISPUTE_LABEL[dispute.status]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Opened by {dispute.openedBy.displayName} on{" "}
            {dispute.createdAt.toLocaleDateString("en-GB")}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm">{dispute.description}</p>

          {dispute.resolution ? (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Admin decision
                {dispute.resolvedBy ? ` · ${dispute.resolvedBy.displayName}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm">{dispute.resolution}</p>
            </div>
          ) : null}

          {isParty &&
          dispute.openedBy.id === auth.user.id &&
          (dispute.status === "open" || dispute.status === "under_review") ? (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <WithdrawDisputeForm dealId={deal.id} />
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* --- reviews: both sides rate each other --- */}
      {canReview && counterparty ? (
        <Card className="mt-3">
          <h2 className="mb-3 text-sm font-semibold">Leave a review</h2>
          <ReviewForm dealId={deal.id} counterpartyName={counterparty.displayName} />
        </Card>
      ) : null}

      {reviews.length > 0 ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">Reviews</h2>
          <ul className="mt-2 space-y-3">
            {reviews.map((review, index) => (
              <li key={index} className="border-t border-[var(--border)] pt-3 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-[var(--muted)]">
                    {review.authorName} on the {review.subjectSide} ·{" "}
                    {review.createdAt.toLocaleDateString("en-GB")}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-1.5 whitespace-pre-line text-sm">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
          {reviews.length === 1 && isParty ? (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Waiting on the other side to leave theirs.
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* --- chat --- */}
      {messages ? (
        <Card className="mt-3">
          <h2 className="text-sm font-semibold">Messages</h2>
          <p className="mt-1 mb-4 text-xs text-[var(--muted)]">
            {role === "admin"
              ? "Everything the two parties have said, plus your internal notes."
              : "The admin can read this. Keep the whole trade in here — it is the record if anything goes wrong."}
          </p>
          <DealChat
            dealId={deal.id}
            messages={messages}
            canPostAdminNote={role === "admin"}
          />
        </Card>
      ) : null}

      {isParty && PRE_PAYMENT_STATUSES.includes(deal.status) ? (
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <CancelDealForm dealId={deal.id} />
        </div>
      ) : null}

      {canDispute && !dispute ? (
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <OpenDisputeForm dealId={deal.id} />
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          Back to your deals
        </Link>
      </p>
    </div>
  );
}

const DISPUTE_LABEL: Record<string, string> = {
  open: "open",
  under_review: "under review",
  resolved_buyer: "decided for the buyer",
  resolved_seller: "decided for the seller",
  cancelled: "withdrawn",
};

function Banner({ children, tone }: { children: React.ReactNode; tone: "success" | "neutral" }) {
  return (
    <div
      className={`mb-6 rounded-lg border px-3 py-2.5 text-sm ${
        tone === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--tone-success)]"
          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * The one card that says what happens next, written for whoever is reading it.
 * Deliberately explicit about who is waiting on whom — the commonest support
 * question in an escrow flow is "is it my turn?".
 */
function NextStep({
  deal,
  role,
  paymentMethods,
}: {
  deal: DealView;
  role: DealViewerRole;
  paymentMethods: PaymentMethodView[];
}) {
  const isSeller = role === "seller";
  const isBuyer = role === "buyer";
  const isParty = isSeller || isBuyer;
  const isSwap = deal.tradeKind === "swap";

  switch (deal.status) {
    case "awaiting_counterparty":
      return (
        <Card>
          <h2 className="text-sm font-semibold">Waiting for the other person</h2>
          {deal.inviteCode ? (
            <div className="mt-3">
              <InviteShare code={deal.inviteCode} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">
              The person who opened this deal has the invite code.
            </p>
          )}
        </Card>
      );

    case "awaiting_credentials": {
      // On a swap both sides deposit, so the question is not "are you the
      // seller" but "have you deposited yet".
      if (isSwap && isParty) {
        const yoursIn = isSeller ? deal.hasCredentials : deal.hasCounterCredentials;
        const theirsIn = isSeller ? deal.hasCounterCredentials : deal.hasCredentials;
        const them = (isSeller ? deal.buyer : deal.seller)?.displayName ?? "The other person";

        return (
          <Card>
            <h2 className="text-sm font-semibold">
              {yoursIn ? `Waiting for ${them}` : "Your turn: hand over your account"}
            </h2>
            <p className="mt-2 mb-4 text-sm text-[var(--muted)]">
              {yoursIn
                ? `Your account is deposited and encrypted. Nothing is released until ${them} deposits theirs too — then both are checked and handed over together. You can still correct yours until then.`
                : `Submit the login for the account you are giving up. It is encrypted immediately and held by the admin. ${theirsIn ? `${them} has already deposited theirs.` : `${them} has not deposited yet either.`} Neither account moves until both are in.`}
            </p>
            <DepositCredentialsForm dealId={deal.id} alreadyDeposited={yoursIn} />
          </Card>
        );
      }

      if (isSeller) {
        return (
          <Card>
            <h2 className="text-sm font-semibold">Your turn: hand over the account</h2>
            <p className="mt-2 mb-4 text-sm text-[var(--muted)]">
              Submit the login. It is encrypted immediately and held by the admin — the buyer does
              not get it until they have paid and the account has been checked.
            </p>
            <DepositCredentialsForm dealId={deal.id} alreadyDeposited={deal.hasCredentials} />
          </Card>
        );
      }

      return (
        <Card>
          <h2 className="text-sm font-semibold">Waiting for the seller</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {deal.seller?.displayName ?? "The seller"} has to deposit the account details before you
            pay anything. Do not send money outside this deal.
          </p>
        </Card>
      );
    }

    case "awaiting_payment":
      if (isBuyer) {
        return (
          <Card>
            <h2 className="text-sm font-semibold">Your turn: pay into escrow</h2>
            <p className="mt-2 mb-4 text-sm text-[var(--muted)]">
              The account is deposited and held by the admin. Pay the exact amount, then tell the
              admin what you sent.
            </p>
            <PayDealForm
              dealId={deal.id}
              amountLabel={formatCents(deal.agreedPriceCents, deal.currency)}
              methods={paymentMethods}
            />
          </Card>
        );
      }

      if (isSeller) {
        return (
          <Card>
            <h2 className="text-sm font-semibold">Waiting for the buyer to pay</h2>
            <p className="mt-2 mb-4 text-sm text-[var(--muted)]">
              The account is with escrow. You can still correct the details until the buyer sends
              payment — after that they are frozen.
            </p>
            <DepositCredentialsForm dealId={deal.id} alreadyDeposited={deal.hasCredentials} />
          </Card>
        );
      }

      return (
        <Card>
          <h2 className="text-sm font-semibold">Waiting for the buyer to pay</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Account deposited{" "}
            {deal.credentialsUpdatedAt
              ? `on ${deal.credentialsUpdatedAt.toLocaleDateString("en-GB")}`
              : ""}
            .
          </p>
        </Card>
      );

    case "payment_submitted":
      return (
        <Card>
          <h2 className="text-sm font-semibold">Waiting for the admin to confirm the payment</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {isBuyer
              ? "You have told the admin the money is sent. They check it arrived before anything is released."
              : "The buyer says they have paid. The admin is checking it arrived — do not hand anything over directly."}
          </p>
          <PaymentReceipt deal={deal} />
        </Card>
      );

    case "admin_verifying":
      return (
        <Card>
          <h2 className="text-sm font-semibold">Funds held — the admin is checking the account</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {isSeller
              ? "The money is with the admin. They are logging in to confirm the account matches your description before releasing it."
              : "Your money is held, not sent to the seller. The admin is confirming the account works before you get it."}
          </p>
          <PaymentReceipt deal={deal} />
        </Card>
      );

    case "credentials_released":
    case "claiming":
      // On a swap both parties have an account waiting and both must confirm,
      // so the same panel serves either side.
      if (isSwap && isParty) {
        const youConfirmed = isSeller ? deal.sellerConfirmedAt : deal.buyerConfirmedAt;
        const theyConfirmed = isSeller ? deal.buyerConfirmedAt : deal.sellerConfirmedAt;
        const them = (isSeller ? deal.buyer : deal.seller)?.displayName ?? "the other person";

        return (
          <Card>
            <h2 className="text-sm font-semibold">
              {youConfirmed ? `Waiting for ${them} to confirm` : "Both accounts released"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {youConfirmed
                ? `You have confirmed. The swap closes once ${them} confirms they have taken over the account you gave them.`
                : "Log in, change the email and password straight away, then confirm below. The swap is not finished until both of you have."}
            </p>
            {deal.confirmationDeadline && !youConfirmed ? (
              <p className="mt-2 text-xs text-[var(--tone-warning)]">
                Please confirm by {deal.confirmationDeadline.toLocaleString("en-GB")}. If you go
                quiet, the admin will chase you.
              </p>
            ) : null}
            {theyConfirmed ? (
              <p className="mt-2 text-xs text-[var(--accent)]">
                {them} has already confirmed their side.
              </p>
            ) : null}

            <div className="mt-4">
              <CredentialsPanel
                dealId={deal.id}
                action={revealForBuyerAction}
                revealLabel="Show the account you received"
                note="Shown only when you ask, so they are not left sitting on screen."
              />
            </div>

            {youConfirmed ? null : (
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <ConfirmClaimForm dealId={deal.id} />
              </div>
            )}
          </Card>
        );
      }

      if (isBuyer) {
        return (
          <Card>
            <h2 className="text-sm font-semibold">The account is yours to claim</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Change the email and password straight away, then confirm below. The seller is not paid
              until you do.
            </p>
            {deal.confirmationDeadline ? (
              <p className="mt-2 text-xs text-[var(--tone-warning)]">
                Please confirm by {deal.confirmationDeadline.toLocaleString("en-GB")}. If you go
                quiet, the admin will chase you.
              </p>
            ) : null}

            <div className="mt-4">
              <CredentialsPanel
                dealId={deal.id}
                action={revealForBuyerAction}
                revealLabel="Show the account details"
                note="Shown only when you ask, so they are not left sitting on screen."
              />
            </div>

            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <ConfirmClaimForm dealId={deal.id} />
            </div>
          </Card>
        );
      }

      return (
        <Card>
          <h2 className="text-sm font-semibold">Released to the buyer</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {isSeller
              ? "The admin verified the account and handed it over. You are paid once the buyer confirms they have claimed it."
              : "Credentials have been released to the buyer."}
          </p>
          {deal.confirmationDeadline ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Buyer has until {deal.confirmationDeadline.toLocaleString("en-GB")} to confirm.
            </p>
          ) : null}
        </Card>
      );

    case "completed":
      return (
        <Card>
          <h2 className="text-sm font-semibold">Done</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            The buyer confirmed the account is claimed
            {deal.buyerConfirmedAt ? ` on ${deal.buyerConfirmedAt.toLocaleDateString("en-GB")}` : ""}.
            {isSeller
              ? ` You are owed ${formatCents(deal.sellerPayoutCents, deal.currency)}.`
              : ""}
          </p>
          {deal.payoutAt ? (
            <p className="mt-2 text-xs text-[var(--tone-success)]">
              Payout sent {deal.payoutAt.toLocaleDateString("en-GB")}
              {deal.payoutReference ? ` · ref ${deal.payoutReference}` : ""}
            </p>
          ) : (
            <p className="mt-2 text-xs text-[var(--muted)]">
              {isSeller
                ? "The admin still has to send your payout. It will show here once they do."
                : "Nothing left for you to do."}
            </p>
          )}
        </Card>
      );

    case "disputed":
      return (
        <Card>
          <h2 className="text-sm font-semibold">Frozen while the admin decides</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Neither the money nor the account moves until this is settled. Add anything useful to the
            messages below — the admin decides from what is on this page.
          </p>
        </Card>
      );

    case "refunded":
      return (
        <Card>
          <h2 className="text-sm font-semibold">Refunded</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            The admin ended this deal and returned the money to the buyer.
          </p>
        </Card>
      );

    case "cancelled":
      return (
        <Card>
          <h2 className="text-sm font-semibold">This deal was cancelled</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            No money changed hands. Open a new deal if you still want to trade.
          </p>
        </Card>
      );

    default:
      return (
        <Card>
          <h2 className="text-sm font-semibold">{DEAL_STATUS_LABEL[deal.status]}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">The admin is handling this deal.</p>
        </Card>
      );
  }
}

/** What the buyer said they sent. Visible to both parties and the admin. */
function PaymentReceipt({ deal }: { deal: DealView }) {
  if (!deal.paymentSubmittedAt) return null;

  return (
    <dl className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4 text-xs">
      <div className="flex justify-between gap-4">
        <dt className="text-[var(--muted)]">Submitted</dt>
        <dd>{deal.paymentSubmittedAt.toLocaleString("en-GB")}</dd>
      </div>
      {deal.paymentTxHash ? (
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-[var(--muted)]">Transaction</dt>
          <dd className="break-all font-mono">{deal.paymentTxHash}</dd>
        </div>
      ) : null}
      {deal.paymentReference ? (
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-[var(--muted)]">Reference</dt>
          <dd className="break-all">{deal.paymentReference}</dd>
        </div>
      ) : null}
      {deal.paymentConfirmedAt ? (
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted)]">Confirmed by admin</dt>
          <dd className="text-[var(--tone-success)]">{deal.paymentConfirmedAt.toLocaleString("en-GB")}</dd>
        </div>
      ) : null}
    </dl>
  );
}
