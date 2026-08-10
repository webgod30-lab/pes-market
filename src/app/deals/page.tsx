import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listDealsForUser } from "@/lib/deals";
import { formatCents } from "@/lib/money";
import { isTurnOf, OPEN_STATUSES } from "@/lib/deal-status";
import { traderSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { FilterChips } from "@/components/dashboard/filter-chips";
import { StatusBadge } from "@/components/trade/status-badge";
import { Badge, SetupProblem } from "@/components/ui";
import type { DealStatus } from "@/generated/prisma/client";

export const metadata = { title: "Trade history" };

type DealRow = Awaited<ReturnType<typeof listDealsForUser>>[number];

const VIEWS = ["all", "open", "settled"] as const;
type View = (typeof VIEWS)[number];

const SETTLED: DealStatus[] = ["completed", "refunded", "cancelled"];

function isView(value: string | undefined): value is View {
  return VIEWS.includes(value as View);
}

/**
 * Every trade this person has ever been part of.
 *
 * The dashboard already lists deals, but it lists them as *work*: the newest
 * first, mixed together, next to the figures telling you what needs doing. That
 * is the right answer to "what should I do now" and the wrong one to "what
 * happened with that trade in March".
 *
 * So this is the archive — same data, no extra query, filtered by whether a
 * deal is still running. It reads from listDealsForUser exactly as the
 * dashboard does; nothing about the escrow is involved.
 */
export default async function TradeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const auth = await requireUserOrProblem(null, "/deals");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const user = auth.user;
  const { view: raw } = await searchParams;
  const view: View = isView(raw) ? raw : "all";

  const all = await listDealsForUser(user.id);

  const deals = all.filter((deal) => {
    if (view === "open") return OPEN_STATUSES.includes(deal.status);
    if (view === "settled") return SETTLED.includes(deal.status);
    return true;
  });

  const sideOf = (deal: DealRow) => (deal.sellerId === user.id ? "seller" : "buyer");

  const counts = {
    all: all.length,
    open: all.filter((deal) => OPEN_STATUSES.includes(deal.status)).length,
    settled: all.filter((deal) => SETTLED.includes(deal.status)).length,
  };

  return (
    <DashShell
      groups={traderSections({
        waiting: all.filter((deal) => isTurnOf(deal.status, sideOf(deal), deal.tradeKind)).length,
      })}
      title="Trade history"
      description="Every deal you have been part of, on either side, whatever the outcome."
    >
      <FilterChips
        options={[
          { label: `All (${counts.all})`, href: "/deals", active: view === "all" },
          { label: `Still running (${counts.open})`, href: "/deals?view=open", active: view === "open" },
          { label: `Settled (${counts.settled})`, href: "/deals?view=settled", active: view === "settled" },
        ]}
      />

      <DataTable
        caption="Your trade history"
        rows={deals}
        rowKey={(deal) => deal.id}
        rowHref={(deal) => `/deals/${deal.id}`}
        columns={historyColumns(sideOf)}
        empty={
          view === "all" ? (
            <EmptyPanel
              icon="folder"
              title="No trades yet"
              action={{ href: "/deals/new", label: "Open a deal" }}
              secondaryAction={{ href: "/deals/join", label: "I have a code" }}
            >
              Once you complete one, it stays here permanently — including the ones that went
              wrong. The record is what makes a rating mean anything.
            </EmptyPanel>
          ) : (
            <EmptyPanel
              icon="folder"
              title={view === "open" ? "Nothing running right now" : "Nothing settled yet"}
              secondaryAction={{ href: "/deals", label: "Show everything" }}
            >
              {view === "open"
                ? "None of your deals are currently in flight."
                : "A deal lands here once it completes, is refunded, or is called off."}
            </EmptyPanel>
          )
        }
      />

      <p className="mt-6 text-xs text-[var(--muted)]">
        Looking for what needs doing rather than what happened?{" "}
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          Your dashboard
        </Link>{" "}
        shows that.
      </p>
    </DashShell>
  );
}

function historyColumns(sideOf: (deal: DealRow) => "seller" | "buyer"): Column<DealRow>[] {
  return [
    {
      key: "reference",
      header: "Reference",
      primary: true,
      cell: (deal) => <span className="font-mono text-sm">{deal.reference}</span>,
    },
    {
      key: "opened",
      header: "Opened",
      hideOnMobile: true,
      cell: (deal) => (
        <time dateTime={deal.createdAt.toISOString()} className="text-xs text-[var(--muted)]">
          {deal.createdAt.toLocaleDateString("en-GB")}
        </time>
      ),
    },
    {
      key: "account",
      header: "Account",
      cell: (deal) => (
        <span className="line-clamp-2 max-w-xs text-xs text-[var(--muted)]">
          {deal.accountSummary}
        </span>
      ),
    },
    {
      key: "side",
      header: "Your side",
      cell: (deal) => {
        const side = sideOf(deal);

        return <Badge tone={side === "seller" ? "info" : "success"}>{side}</Badge>;
      },
    },
    {
      key: "amount",
      header: "Amount",
      align: "end",
      cell: (deal) => {
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
      cell: (deal) => <StatusBadge status={deal.status} side={sideOf(deal)} size="sm" />,
    },
  ];
}
