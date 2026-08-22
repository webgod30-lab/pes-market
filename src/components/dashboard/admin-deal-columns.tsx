import { formatCents } from "@/lib/money";
import { DEAL_STATUS_TONE, dealStatusLabel } from "@/lib/deal-status";
import type { Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui";
import type { DealStatus } from "@/generated/prisma/client";
import { ADMIN_DEAL_COLUMNS } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";

/**
 * What an admin needs to see about a deal in a list.
 *
 * This replaces `components/admin-deal-row.tsx`, which rendered the same card
 * on the overview and on the deals list. Same information, but as columns the
 * two pages share — an admin scanning forty rows for the one with a stale
 * deadline needs the dates to line up under each other, which a stack of cards
 * cannot do.
 *
 * The two flags are the reason this is not a generic table. `payout due` and
 * `buyer overdue` are not statuses in the database; they are derived from a
 * completed deal with no payout timestamp, and from a confirmation deadline
 * that has passed. They are the whole reason an admin opens this list, so they
 * sit next to the status rather than being worked out from two other columns.
 */
export type AdminDealRowData = {
  id: string;
  reference: string;
  accountSummary: string;
  status: DealStatus;
  agreedPriceCents: number;
  feeCents: number;
  sellerPayoutCents: number;
  currency: string;
  payoutAt: Date | null;
  confirmationDeadline: Date | null;
  seller: { displayName: string } | null;
  buyer: { displayName: string } | null;
};

export function isPayoutDue(deal: AdminDealRowData): boolean {
  return deal.status === "completed" && !deal.payoutAt;
}

export function isBuyerOverdue(deal: AdminDealRowData, now: Date): boolean {
  return (
    deal.confirmationDeadline !== null &&
    deal.confirmationDeadline < now &&
    (deal.status === "credentials_released" || deal.status === "claiming")
  );
}

export function adminDealColumns(now: Date, locale: Locale = "en"): Column<AdminDealRowData>[] {
  const copy = ADMIN_DEAL_COLUMNS[locale];

  return [
    {
      key: "reference",
      header: copy.reference,
      primary: true,
      cell: (deal) => <span className="font-mono text-sm">{deal.reference}</span>,
    },
    {
      key: "parties",
      header: copy.sellerToBuyer,
      cell: (deal) => (
        <span className="text-xs text-[var(--muted)]">
          {deal.seller?.displayName ?? "—"} → {deal.buyer?.displayName ?? "—"}
        </span>
      ),
    },
    {
      key: "account",
      header: copy.account,
      hideOnMobile: true,
      cell: (deal) => (
        <span className="line-clamp-2 max-w-xs text-xs text-[var(--muted)]">
          {deal.accountSummary}
        </span>
      ),
    },
    {
      key: "amount",
      header: copy.amount,
      align: "end",
      cell: (deal) => (
        <span className="whitespace-nowrap">
          <span className="font-semibold">
            {formatCents(deal.agreedPriceCents, deal.currency)}
          </span>
          <span className="block text-xs text-[var(--muted)]">
            {isPayoutDue(deal)
              ? copy.paySeller(formatCents(deal.sellerPayoutCents, deal.currency))
              : copy.yourCut(formatCents(deal.feeCents, deal.currency))}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: copy.status,
      align: "end",
      cell: (deal) => (
        <span className="flex flex-wrap justify-end gap-1.5">
          <Badge tone={DEAL_STATUS_TONE[deal.status]}>{dealStatusLabel(locale)[deal.status]}</Badge>
          {isPayoutDue(deal) ? <Badge tone="warning">{copy.payoutDue}</Badge> : null}
          {isBuyerOverdue(deal, now) ? <Badge tone="danger">{copy.buyerOverdue}</Badge> : null}
        </span>
      ),
    },
  ];
}
