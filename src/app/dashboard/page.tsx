import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUserOrProblem } from "@/lib/dal";
import { listDealsForUser } from "@/lib/deals";
import { unreadCountForUser } from "@/lib/messages";
import { getReputation } from "@/lib/reviews";
import { ReputationLine } from "@/components/reputation";
import { formatCents } from "@/lib/money";
import { getBalance, MINIMUM_WITHDRAWAL_CENTS } from "@/lib/wallet";
import { DEAL_STATUS_LABEL, DEAL_STATUS_TONE, isTurnOf, OPEN_STATUSES } from "@/lib/deal-status";
import { Breakdown, type Segment } from "@/components/dashboard/breakdown";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { traderSections } from "@/components/dashboard/dash-nav";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Badge, ButtonLink, SetupProblem } from "@/components/ui";
import type { DealStatus } from "@/generated/prisma/client";

export const metadata = { title: "Your deals" };

type DealRow = Awaited<ReturnType<typeof listDealsForUser>>[number];

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

  // A promoter has no deals and no way to make one, so this page can only ever
  // be an empty list with two buttons that refuse.
  if (user.role === "promoter") redirect("/referrals");

  // Every deal where this person is either side.
  const [deals, unread, reputation] = await Promise.all([
    listDealsForUser(user.id),
    unreadCountForUser(user.id),
    getReputation(user.id),
  ]);

  const sideOf = (deal: DealRow) => (deal.sellerId === user.id ? "seller" : "buyer");
  const isYourTurn = (deal: DealRow) => isTurnOf(deal.status, sideOf(deal), deal.tradeKind);

  const openCount = deals.filter((deal) => OPEN_STATUSES.includes(deal.status)).length;
  const waitingOnYou = deals.filter(isYourTurn).length;

  // This used to be "money riding on open deals". A swap has no money in it at
  // all, so that figure was $0.00 on every account with no way for it ever to
  // be anything else. What replaced it is the only balance a user can now have:
  // what their promoter code has earned them.
  const balance = await getBalance(user.id);

  return (
    <DashShell
      groups={traderSections({ waiting: waitingOnYou })}
      title={`Hello, ${user.displayName}`}
      description={
        <>
          <span className="block">Every deal you are part of, on either side.</span>
          <ReputationLine reputation={reputation} />
        </>
      }
      actions={
        <>
          <ButtonLink href="/deals/new" size="sm">
            Open a deal
          </ButtonLink>
          <ButtonLink href="/deals/join" variant="secondary" size="sm">
            I have a code
          </ButtonLink>
        </>
      }
    >
      <StatGrid columns={4}>
        <StatCard
          label="Open deals"
          value={openCount}
          caption={openCount === 1 ? "still running" : "still running"}
          icon="folder"
        />
        <StatCard
          label="Waiting on you"
          value={waitingOnYou}
          caption="your move next"
          icon="route"
          urgent
        />
        <StatCard
          label="Unread messages"
          value={unread}
          caption="across all deals"
          icon="mail"
          urgent
        />
        <StatCard
          label="Referral earnings"
          value={formatCents(balance.availableCents)}
          caption={
            balance.meetsMinimum
              ? "ready to withdraw"
              : `${formatCents(MINIMUM_WITHDRAWAL_CENTS)} minimum`
          }
          icon="wallet"
          href="/referrals"
        />
      </StatGrid>

      {deals.length > 0 ? (
        <div className="mt-3">
          <Breakdown
            title="Where your deals stand"
            caption="Every deal you have ever been part of, by stage."
            segments={statusSegments(deals)}
          />
        </div>
      ) : null}

      <h2 className="mb-3 mt-8 text-sm font-semibold">Your deals</h2>

      <DataTable
        caption="Every deal you are part of"
        rows={deals}
        rowKey={(deal) => deal.id}
        rowHref={(deal) => `/deals/${deal.id}`}
        columns={dealColumns(sideOf, isYourTurn)}
        empty={
          <EmptyPanel
            icon="folder"
            title="No deals yet"
            action={{ href: "/deals/new", label: "Open a deal" }}
            secondaryAction={{ href: "/deals/join", label: "I have a code" }}
          >
            Open one and send the invite code to the other person, or join a deal you were invited
            to. Nothing is bought or sold here — you bring a deal you have already agreed.
          </EmptyPanel>
        }
      />

      <p className="mt-6 text-xs text-[var(--muted)]">
        Not sure what happens next?{" "}
        <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">
          Read how a trade works
        </Link>
        .
      </p>
    </DashShell>
  );
}

/** The status mix, from the rows already on the page. No extra query. */
function statusSegments(deals: DealRow[]): Segment[] {
  const counts = new Map<DealStatus, number>();

  for (const deal of deals) {
    counts.set(deal.status, (counts.get(deal.status) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([status, value]) => ({
      label: DEAL_STATUS_LABEL[status],
      value,
      tone: DEAL_STATUS_TONE[status],
    }))
    .sort((a, b) => b.value - a.value);
}

function dealColumns(
  sideOf: (deal: DealRow) => "seller" | "buyer",
  isYourTurn: (deal: DealRow) => boolean,
): Column<DealRow>[] {
  return [
    {
      key: "reference",
      header: "Reference",
      primary: true,
      cell: (deal) => <span className="font-mono text-sm">{deal.reference}</span>,
    },
    {
      key: "account",
      header: "Account",
      cell: (deal) => (
        <span className="line-clamp-2 max-w-md text-xs text-[var(--muted)]">
          {deal.accountSummary}
        </span>
      ),
    },
    {
      key: "side",
      header: "Your side",
      cell: (deal) => {
        const side = sideOf(deal);

        return (
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone={side === "seller" ? "info" : "success"}>{side}</Badge>
            {isYourTurn(deal) ? <Badge tone="warning">your turn</Badge> : null}
          </span>
        );
      },
    },
    {
      // Was "Amount". On a swap that column read $0.00 on every row, because
      // there is no amount — so it now says what the trade actually is, and
      // only shows a figure for the archived cash deals that really had one.
      key: "trade",
      header: "Trade",
      align: "end",
      cell: (deal) => {
        if (deal.tradeKind === "swap") {
          return (
            <span className="whitespace-nowrap">
              <span className="font-semibold">Swap</span>
              <span className="block text-xs text-[var(--muted)]">account for account</span>
            </span>
          );
        }

        const isSeller = sideOf(deal) === "seller";

        return (
          <span className="whitespace-nowrap">
            <span className="font-semibold">
              {formatCents(isSeller ? deal.sellerPayoutCents : deal.agreedPriceCents, deal.currency)}
            </span>
            <span className="block text-xs text-[var(--muted)]">
              {isSeller ? "you received" : "you paid"}
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      align: "end",
      cell: (deal) => (
        <Badge tone={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABEL[deal.status]}</Badge>
      ),
    },
  ];
}
