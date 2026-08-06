import { requireUserOrProblem } from "@/lib/dal";
import { listDisputesForAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/money";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { FilterChips } from "@/components/dashboard/filter-chips";
import { Badge, SetupProblem } from "@/components/ui";

export const metadata = { title: "Disputes — admin" };

const STATUS_LABEL: Record<string, string> = {
  open: "open",
  under_review: "under review",
  resolved_buyer: "refunded the buyer",
  resolved_seller: "paid the seller",
  cancelled: "withdrawn",
};

type Dispute = Awaited<ReturnType<typeof listDisputesForAdmin>>[number];

const isOpen = (dispute: Dispute) => dispute.status === "open" || dispute.status === "under_review";

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const auth = await requireUserOrProblem(["admin"], "/admin/disputes");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

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
      title="Disputes"
      description="A dispute freezes the deal. Nothing moves until you decide it."
    >
      <FilterChips
        options={[
          { label: "Open", href: "/admin/disputes", active: onlyOpen },
          { label: "All, including resolved", href: "/admin/disputes?show=all", active: !onlyOpen },
        ]}
      />

      <DataTable
        caption={onlyOpen ? "Open disputes" : "Every dispute"}
        rows={disputes}
        rowKey={(dispute) => dispute.id}
        rowHref={(dispute) => `/admin/deals/${dispute.deal.id}`}
        columns={disputeColumns}
        empty={
          onlyOpen ? (
            <EmptyPanel icon="scales" title="No open disputes" tone="positive">
              Everything is running itself. A dispute freezes its deal the moment either side opens
              one, so an empty list here means no money is stuck.
            </EmptyPanel>
          ) : (
            <EmptyPanel icon="scales" title="No disputes yet">
              Nobody has ever opened one. This list keeps resolved cases too, so it will not stay
              empty once one is decided.
            </EmptyPanel>
          )
        }
      />
    </DashShell>
  );
}

const disputeColumns: Column<Dispute>[] = [
  {
    key: "reference",
    header: "Reference",
    primary: true,
    cell: (dispute) => <span className="font-mono text-sm">{dispute.deal.reference}</span>,
  },
  {
    key: "reason",
    header: "Reason",
    cell: (dispute) => <span className="line-clamp-2 max-w-sm text-sm">{dispute.reason}</span>,
  },
  {
    key: "opened",
    header: "Opened by",
    hideOnMobile: true,
    cell: (dispute) => (
      <span className="text-xs text-[var(--muted)]">
        {dispute.openedBy.displayName}
        <span className="block">{dispute.createdAt.toLocaleDateString("en-GB")}</span>
      </span>
    ),
  },
  {
    key: "parties",
    header: "Seller → Buyer",
    hideOnMobile: true,
    cell: (dispute) => (
      <span className="text-xs text-[var(--muted)]">
        {dispute.deal.seller?.displayName ?? "—"} → {dispute.deal.buyer?.displayName ?? "—"}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "end",
    cell: (dispute) => (
      <span className="font-semibold">
        {formatCents(dispute.deal.agreedPriceCents, dispute.deal.currency)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "end",
    cell: (dispute) => (
      <Badge tone={isOpen(dispute) ? "danger" : "neutral"}>
        {STATUS_LABEL[dispute.status] ?? dispute.status}
      </Badge>
    ),
  },
];
