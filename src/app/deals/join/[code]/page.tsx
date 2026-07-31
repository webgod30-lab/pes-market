import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { findInvite } from "@/lib/deals";
import { getReputation } from "@/lib/reviews";
import { formatCents } from "@/lib/money";
import { JoinDealForm } from "@/components/join-deal-form";
import { ReputationLine } from "@/components/reputation";
import { Badge, Card, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Join a deal — PES Escrow" };

export default async function JoinByCodePage({
  params,
}: {
  // Next.js 16: params is a Promise.
  params: Promise<{ code: string }>;
}) {
  const auth = await requireUserOrProblem(null, "/deals/join");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const { code } = await params;
  const invite = await findInvite(decodeURIComponent(code));

  if (!invite) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeading title="This invite is not usable" />
        <Card>
          <p className="text-sm text-[var(--muted)]">
            The code is wrong, someone has already joined this deal, or it was cancelled.
          </p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Ask the other person to check it, or{" "}
            <Link href="/deals/join" className="text-emerald-400 hover:underline">
              paste a different code
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
      <PageHeading
        title="Join this deal"
        description={`${invite.counterpartyName} invited you. Check the terms match what you agreed.`}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold">{invite.reference}</span>
          <Badge tone={invite.joinAs === "seller" ? "info" : "success"}>
            you would be the {invite.joinAs}
          </Badge>
        </div>

        <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Who invited you
          </p>
          <p className="mt-1 text-sm font-medium">{invite.counterpartyName}</p>
          <div className="mt-1">
            <ReputationLine reputation={theirReputation} />
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
            <dt className="text-[var(--muted)]">Buyer pays</dt>
            <dd className="font-medium">
              {formatCents(invite.agreedPriceCents, invite.currency)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Escrow fee</dt>
            <dd>−{formatCents(invite.feeCents, invite.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Seller receives</dt>
            <dd className="font-semibold text-emerald-400">
              {formatCents(invite.sellerPayoutCents, invite.currency)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-3">
        {isOwnDeal ? (
          <p className="text-sm text-[var(--muted)]">
            This is the deal you created — you cannot be both sides. Send the code to the other
            person instead.
          </p>
        ) : (
          <JoinDealForm defaultCode={decodeURIComponent(code)} />
        )}
      </Card>

      {!isOwnDeal ? (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          If these terms are not what you agreed, do not join. Nothing is committed until you do.
        </p>
      ) : null}
    </div>
  );
}
