import { requireUserOrProblem } from "@/lib/dal";
import { listDisputesForAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/money";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { FilterChips } from "@/components/dashboard/filter-chips";
import { Badge, SetupProblem } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { ADMIN_DISPUTES_PAGE } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";

export const metadata = { title: "Disputes — admin" };

type Dispute = Awaited<ReturnType<typeof listDisputesForAdmin>>[number];

const isOpen = (dispute: Dispute) => dispute.status === "open" || dispute.status === "under_review";

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const auth = await requireUserOrProblem(["admin"], "/admin/disputes");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const locale = await getLocale();
  const copy = ADMIN_DISPUTES_PAGE[locale];

  const params = await searchParams;
  const onlyOpen = params.show !== "all";

  const disputes = await listDisputesForAdmin(onlyOpen);

  return (
    <DashShell
      groups={adminSections({
        // Only when the list is the open ones — otherwise this would count
        // resolved cases as work waiting.
        disputes: onlyOpen ? disputes.length : undefined,
      })}
      title={copy.title}
      description={copy.description}
    >
      <FilterChips
        options={[
          { label: copy.filterOpen, href: "/admin/disputes", active: onlyOpen },
          { label: copy.filterAll, href: "/admin/disputes?show=all", active: !onlyOpen },
        ]}
      />

      <DataTable
        caption={onlyOpen ? copy.captionOpen : copy.captionAll}
        rows={disputes}
        rowKey={(dispute) => dispute.id}
        rowHref={(dispute) => `/admin/deals/${dispute.deal.id}`}
        columns={disputeColumns(copy, locale)}
        empty={
          onlyOpen ? (
            <EmptyPanel icon="scales" title={copy.noOpenTitle} tone="positive">
              {copy.noOpenBody}
            </EmptyPanel>
          ) : (
            <EmptyPanel icon="scales" title={copy.noneYetTitle}>
              {copy.noneYetBody}
            </EmptyPanel>
          )
        }
      />
    </DashShell>
  );
}

function disputeColumns(copy: (typeof ADMIN_DISPUTES_PAGE)["en"], locale: Locale): Column<Dispute>[] {
  const statusLabel: Record<string, string> = {
    open: copy.statusOpen,
    under_review: copy.statusUnderReview,
    resolved_buyer: copy.statusResolvedBuyer,
    resolved_seller: copy.statusResolvedSeller,
    cancelled: copy.statusCancelled,
  };

  return [
    {
      key: "reference",
      header: copy.colReference,
      primary: true,
      cell: (dispute) => <span className="font-mono text-sm">{dispute.deal.reference}</span>,
    },
    {
      key: "reason",
      header: copy.colReason,
      cell: (dispute) => <span className="line-clamp-2 max-w-sm text-sm">{dispute.reason}</span>,
    },
    {
      key: "opened",
      header: copy.colOpenedBy,
      hideOnMobile: true,
      cell: (dispute) => (
        <span className="text-xs text-[var(--muted)]">
          {dispute.openedBy.displayName}
          <span className="block">
            {dispute.createdAt.toLocaleDateString(locale === "ar" ? "ar" : "en-GB")}
          </span>
        </span>
      ),
    },
    {
      key: "parties",
      header: copy.colParties,
      hideOnMobile: true,
      cell: (dispute) => (
        <span className="text-xs text-[var(--muted)]">
          {dispute.deal.seller?.displayName ?? "—"} → {dispute.deal.buyer?.displayName ?? "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: copy.colAmount,
      align: "end",
      cell: (dispute) => (
        <span className="font-semibold">
          {formatCents(dispute.deal.agreedPriceCents, dispute.deal.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: copy.colStatus,
      align: "end",
      cell: (dispute) => (
        <Badge tone={isOpen(dispute) ? "danger" : "neutral"}>
          {statusLabel[dispute.status] ?? dispute.status}
        </Badge>
      ),
    },
  ];
}
