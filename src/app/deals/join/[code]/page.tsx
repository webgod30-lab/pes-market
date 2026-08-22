import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { findInvite } from "@/lib/deals";
import { getReputation } from "@/lib/reviews";
import { formatCents } from "@/lib/money";
import { JoinDealForm } from "@/components/join-deal-form";
import { ReputationLine } from "@/components/reputation";
import { Badge, Card, PageHeading, SetupProblem } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { JOIN_BY_CODE_PAGE } from "@/lib/page-copy";

export const metadata = { title: "Join a deal" };

export default async function JoinByCodePage({
  params,
}: {
  // Next.js 16: params is a Promise.
  params: Promise<{ code: string }>;
}) {
  const auth = await requireUserOrProblem(null, "/deals/join");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const locale = await getLocale();
  const copy = JOIN_BY_CODE_PAGE[locale];

  const { code } = await params;
  const invite = await findInvite(decodeURIComponent(code));

  if (!invite) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeading title={copy.invalidTitle} />
        <Card>
          <p className="text-sm text-[var(--muted)]">{copy.invalidBody}</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {copy.invalidAskLead}{" "}
            <Link href="/deals/join" className="text-[var(--accent)] hover:underline">
              {copy.invalidAskLink}
            </Link>
            .
          </p>
        </Card>
      </div>
    );
  }

  // Joining your own deal is refused by the action too; catching it here just
  // avoids showing a pointless form.
  const isOwnDeal = invite.createdById === auth.user.id;

  // The single most useful thing to know before committing: has this person
  // done this before, and did it go well?
  const theirReputation = await getReputation(invite.createdById);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeading title={copy.title} description={copy.description(invite.counterpartyName)} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold">{invite.reference}</span>
          <Badge tone={invite.joinAs === "seller" ? "info" : "success"}>
            {invite.joinAs === "seller" ? copy.wouldBeSeller : copy.wouldBeBuyer}
          </Badge>
        </div>

        <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{copy.whoInvited}</p>
          <p className="mt-1 text-sm font-medium">{invite.counterpartyName}</p>
          <div className="mt-1">
            <ReputationLine reputation={theirReputation} locale={locale} />
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed">{invite.accountSummary}</p>

        <p className="mt-2 text-xs text-[var(--muted)]">
          {invite.game}
          {invite.platform ? ` · ${invite.platform}` : ""}
          {invite.level !== null ? ` · level ${invite.level}` : ""}
        </p>

        <dl className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">{copy.buyerPays}</dt>
            <dd className="font-medium">
              {formatCents(invite.agreedPriceCents, invite.currency)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">{copy.escrowFee}</dt>
            <dd>−{formatCents(invite.feeCents, invite.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">{copy.sellerReceives}</dt>
            <dd className="font-semibold text-[var(--accent)]">
              {formatCents(invite.sellerPayoutCents, invite.currency)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-3">
        {isOwnDeal ? (
          <p className="text-sm text-[var(--muted)]">{copy.ownDeal}</p>
        ) : (
          <JoinDealForm defaultCode={decodeURIComponent(code)} locale={locale} />
        )}
      </Card>

      {!isOwnDeal ? (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">{copy.notWhatAgreed}</p>
      ) : null}
    </div>
  );
}
