import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUserOrProblem } from "@/lib/dal";
import { listDealsForUser } from "@/lib/deals";
import { unreadCountForUser } from "@/lib/messages";
import { getReputation } from "@/lib/reviews";
import { ReputationLine } from "@/components/reputation";
import { formatCents } from "@/lib/money";
import { DEAL_STATUS_LABEL, DEAL_STATUS_TONE, nextActorFor, OPEN_STATUSES } from "@/lib/deal-status";
import { Badge, ButtonLink, Card, EmptyState, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Your deals — PES Escrow" };

export default async function DashboardPage() {
  // Authorization happens here, in the page — not in a layout, which would not
  // re-run on client-side navigation.
  const auth = await requireUserOrProblem(null, "/dashboard");

  // A broken database is reported here, on the server, where the real error is
  // still available. A client error boundary would only see a sanitized one.
  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const user = auth.user;

  // The admin has a purpose-built console.
  if (user.role === "admin") redirect("/admin");

  // Every deal where this person is either side.
  const [deals, unread, reputation] = await Promise.all([
    listDealsForUser(user.id),
    unreadCountForUser(user.id),
    getReputation(user.id),
  ]);

  const openCount = deals.filter((deal) => OPEN_STATUSES.includes(deal.status)).length;

  // Deals where the next move is this person's, on the side they hold.
  const waitingOnYou = deals.filter((deal) => {
    const side = deal.sellerId === user.id ? "seller" : "buyer";
    return nextActorFor(deal.status) === side;
  }).length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div className="mb-8">
          <PageHeading
            title={`Hello, ${user.displayName}`}
            description="Every deal you are part of, on either side."
          />
          <div className="-mt-6">
            <ReputationLine reputation={reputation} />
          </div>
        </div>
        <div className="mb-8 flex gap-2">
          <ButtonLink href="/deals/new">Open a deal</ButtonLink>
          <ButtonLink href="/deals/join" variant="secondary">
            I have a code
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Open deals</p>
          <p className="mt-2 text-2xl font-semibold">{openCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Waiting on you</p>
          <p className="mt-2 text-2xl font-semibold">{waitingOnYou}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Unread messages</p>
          <p className={`mt-2 text-2xl font-semibold ${unread > 0 ? "text-amber-300" : ""}`}>
            {unread}
          </p>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Your deals</h2>

      {deals.length === 0 ? (
        <EmptyState>
          <p className="font-medium text-[var(--foreground)]">No deals yet.</p>
          <p className="mt-1">
            Open one and send the invite code to the other person, or join a deal you were invited
            to.
          </p>
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {deals.map((deal) => {
            const isSeller = deal.sellerId === user.id;
            const side = isSeller ? "seller" : "buyer";
            const yourTurn = nextActorFor(deal.status) === side;

            return (
              <li key={deal.id}>
                <Link href={`/deals/${deal.id}`} className="block">
                  <Card className="p-4 transition-colors hover:border-emerald-500/40">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{deal.reference}</span>
                        <Badge tone={isSeller ? "info" : "success"}>
                          you are the {side}
                        </Badge>
                        {yourTurn ? <Badge tone="warning">your turn</Badge> : null}
                      </div>
                      <p className="mt-1.5 line-clamp-2 max-w-xl text-xs text-[var(--muted)]">
                        {deal.accountSummary}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {/* A seller cares about the payout; a buyer about the price. */}
                        {formatCents(
                          isSeller ? deal.sellerPayoutCents : deal.agreedPriceCents,
                          deal.currency,
                        )}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {isSeller ? "you receive" : "you pay"}
                      </p>
                      <div className="mt-2">
                        <Badge tone={DEAL_STATUS_TONE[deal.status]}>
                          {DEAL_STATUS_LABEL[deal.status]}
                        </Badge>
                      </div>
                    </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-[var(--muted)]">
        Open a deal to see how it works, or{" "}
        <Link href="/" className="text-emerald-400 hover:underline">
          read how a trade works
        </Link>
        .
      </p>
    </div>
  );
}
