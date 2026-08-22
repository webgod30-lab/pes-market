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
import { getLocale } from "@/lib/locale-server";
import { TRADE_HISTORY_PAGE } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";

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
  const locale = await getLocale();
  const copy = TRADE_HISTORY_PAGE[locale];
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
      title={copy.title}
      description={copy.description}
    >
      <FilterChips
        options={[
          { label: copy.filterAll(counts.all), href: "/deals", active: view === "all" },
          { label: copy.filterOpen(counts.open), href: "/deals?view=open", active: view === "open" },
          {
            label: copy.filterSettled(counts.settled),
            href: "/deals?view=settled",
            active: view === "settled",
          },
        ]}
      />

      <DataTable
        caption={copy.tableCaption}
        rows={deals}
        rowKey={(deal) => deal.id}
        rowHref={(deal) => `/deals/${deal.id}`}
        columns={historyColumns(sideOf, copy, locale)}
        empty={
          view === "all" ? (
            <EmptyPanel
              icon="folder"
              title={copy.emptyTitle}
              action={{ href: "/deals/new", label: copy.emptyOpenAction }}
              secondaryAction={{ href: "/deals/join", label: copy.emptyJoinAction }}
            >
              {copy.emptyBody}
            </EmptyPanel>
          ) : (
            <EmptyPanel
              icon="folder"
              title={view === "open" ? copy.emptyOpenTitle : copy.emptySettledTitle}
              secondaryAction={{ href: "/deals", label: copy.emptyShowAll }}
            >
              {view === "open" ? copy.emptyOpenBody : copy.emptySettledBody}
            </EmptyPanel>
          )
        }
      />

      <p className="mt-6 text-xs text-[var(--muted)]">
        {copy.footLead}{" "}
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
          {copy.footLink}
        </Link>{" "}
        {copy.footTail}
      </p>
    </DashShell>
  );
}

function historyColumns(
  sideOf: (deal: DealRow) => "seller" | "buyer",
  copy: (typeof TRADE_HISTORY_PAGE)["en"],
  locale: Locale,
): Column<DealRow>[] {
  return [
    {
      key: "reference",
      header: copy.colReference,
      primary: true,
      cell: (deal) => <span className="font-mono text-sm">{deal.reference}</span>,
    },
    {
      key: "opened",
      header: copy.colOpened,
      hideOnMobile: true,
      cell: (deal) => (
        <time dateTime={deal.createdAt.toISOString()} className="text-xs text-[var(--muted)]">
          {deal.createdAt.toLocaleDateString(locale === "ar" ? "ar" : "en-GB")}
        </time>
      ),
    },
    {
      key: "account",
      header: copy.colAccount,
      cell: (deal) => (
        <span className="line-clamp-2 max-w-xs text-xs text-[var(--muted)]">
          {deal.accountSummary}
        </span>
      ),
    },
    {
      key: "side",
      header: copy.colSide,
      cell: (deal) => {
        const side = sideOf(deal);

        return (
          <Badge tone={side === "seller" ? "info" : "success"}>
            {side === "seller" ? copy.sideSeller : copy.sideBuyer}
          </Badge>
        );
      },
    },
    {
      // Same change as the dashboard table: a swap has no amount, so the
      // column says what the trade was and only quotes money for the archived
      // cash deals that actually involved some.
      key: "trade",
      header: copy.colTrade,
      align: "end",
      cell: (deal) => {
        if (deal.tradeKind === "swap") {
          return (
            <span className="whitespace-nowrap">
              <span className="font-semibold">{copy.swap}</span>
              <span className="block text-xs text-[var(--muted)]">{copy.swapCaption}</span>
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
              {isSeller ? copy.youReceived : copy.youPaid}
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: copy.colStatus,
      align: "end",
      cell: (deal) => <StatusBadge status={deal.status} side={sideOf(deal)} size="sm" locale={locale} />,
    },
  ];
}
