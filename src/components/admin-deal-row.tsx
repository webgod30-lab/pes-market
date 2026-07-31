import Link from "next/link";

import { formatCents } from "@/lib/money";
import { DEAL_STATUS_LABEL, DEAL_STATUS_TONE } from "@/lib/deal-status";
import { Badge, Card } from "@/components/ui";
import type { DealStatus } from "@/generated/prisma/client";

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

/** One deal in an admin list, with whatever flag makes it need attention. */
export function AdminDealRow({ deal, now }: { deal: AdminDealRowData; now: Date }) {
  const payoutDue = deal.status === "completed" && !deal.payoutAt;
  const buyerOverdue =
    deal.confirmationDeadline !== null &&
    deal.confirmationDeadline < now &&
    (deal.status === "credentials_released" || deal.status === "claiming");

  return (
    <Link href={`/admin/deals/${deal.id}`} className="block">
      <Card className="p-4 transition-colors hover:border-emerald-500/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">{deal.reference}</span>
              <Badge tone={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABEL[deal.status]}</Badge>
              {payoutDue ? <Badge tone="warning">payout due</Badge> : null}
              {buyerOverdue ? <Badge tone="danger">buyer overdue</Badge> : null}
            </div>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              {deal.seller?.displayName ?? "—"} → {deal.buyer?.displayName ?? "—"}
            </p>
            <p className="mt-1 line-clamp-2 max-w-xl text-xs text-[var(--muted)]">
              {deal.accountSummary}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">
              {formatCents(deal.agreedPriceCents, deal.currency)}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {payoutDue
                ? `pay seller ${formatCents(deal.sellerPayoutCents, deal.currency)}`
                : `your cut ${formatCents(deal.feeCents, deal.currency)}`}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
