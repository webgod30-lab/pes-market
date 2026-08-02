import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listDisputesForAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/money";
import { AdminNav } from "@/components/admin-nav";
import { Badge, Card, EmptyState, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Disputes — admin — PES Escrow" };

const STATUS_LABEL: Record<string, string> = {
  open: "open",
  under_review: "under review",
  resolved_buyer: "refunded the buyer",
  resolved_seller: "paid the seller",
  cancelled: "withdrawn",
};

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
    <div>
      <PageHeading
        title="Disputes"
        description="A dispute freezes the deal. Nothing moves until you decide it."
      />

      <AdminNav current="disputes" />

      <div className="mb-4 flex flex-wrap gap-1">
        <Link
          href="/admin/disputes"
          className={`rounded-full border px-3 py-1 text-xs ${
            onlyOpen
              ? "border-emerald-500/40 bg-emerald-500/10 text-[var(--tone-success)]"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          Open
        </Link>
        <Link
          href="/admin/disputes?show=all"
          className={`rounded-full border px-3 py-1 text-xs ${
            !onlyOpen
              ? "border-emerald-500/40 bg-emerald-500/10 text-[var(--tone-success)]"
              : "border-[var(--border)] text-[var(--muted)]"
          }`}
        >
          All, including resolved
        </Link>
      </div>

      {disputes.length === 0 ? (
        <EmptyState>
          {onlyOpen ? "No open disputes. Everything is running itself." : "No disputes yet."}
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {disputes.map((dispute) => {
            const isOpen = dispute.status === "open" || dispute.status === "under_review";

            return (
              <li key={dispute.id}>
                <Link href={`/admin/deals/${dispute.deal.id}`} className="block">
                  <Card className="p-4 transition-colors hover:border-emerald-500/40">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {dispute.deal.reference}
                          </span>
                          <Badge tone={isOpen ? "danger" : "neutral"}>
                            {STATUS_LABEL[dispute.status] ?? dispute.status}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm">{dispute.reason}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          opened by {dispute.openedBy.displayName} ·{" "}
                          {dispute.createdAt.toLocaleDateString("en-GB")} ·{" "}
                          {dispute.deal.seller?.displayName ?? "—"} →{" "}
                          {dispute.deal.buyer?.displayName ?? "—"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCents(dispute.deal.agreedPriceCents, dispute.deal.currency)}
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
