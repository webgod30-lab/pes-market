import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listDealsForAdmin, type DealFilter } from "@/lib/admin";
import { DEAL_STATUS_LABEL } from "@/lib/deal-status";
import { AdminNav } from "@/components/admin-nav";
import { AdminDealRow } from "@/components/admin-deal-row";
import { EmptyState, PageHeading, SetupProblem, inputClassName } from "@/components/ui";

export const metadata = { title: "Deals — admin — PES Escrow" };

const FILTERS: { value: DealFilter; label: string }[] = [
  { value: "needs_action", label: "Needs action" },
  { value: "open", label: "In flight" },
  { value: "all", label: "All" },
  { value: "disputed", label: DEAL_STATUS_LABEL.disputed },
  { value: "payment_submitted", label: DEAL_STATUS_LABEL.payment_submitted },
  { value: "admin_verifying", label: DEAL_STATUS_LABEL.admin_verifying },
  { value: "claiming", label: DEAL_STATUS_LABEL.claiming },
  { value: "completed", label: DEAL_STATUS_LABEL.completed },
  { value: "refunded", label: DEAL_STATUS_LABEL.refunded },
  { value: "cancelled", label: DEAL_STATUS_LABEL.cancelled },
];

function isFilter(value: string | undefined): value is DealFilter {
  return FILTERS.some((f) => f.value === value);
}

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const auth = await requireUserOrProblem(["admin"], "/admin/deals");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const params = await searchParams;
  const filter: DealFilter = isFilter(params.filter) ? params.filter : "needs_action";
  const search = params.q ?? "";
  const now = new Date();

  const deals = await listDealsForAdmin(filter, search, now);

  return (
    <div>
      <PageHeading title="Deals" description="Every trade on the service." />

      <AdminNav current="deals" />

      {/* Plain links rather than a client-side control: the filter belongs in
          the URL so it can be linked to from the overview cards. */}
      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((option) => (
          <Link
            key={option.value}
            href={`/admin/deals?filter=${option.value}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filter === option.value
                ? "border-emerald-500/40 bg-emerald-500/10 text-[var(--tone-success)]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="filter" value={filter} />
        <input
          name="q"
          defaultValue={search}
          placeholder="Search reference, description or a person's name"
          className={`${inputClassName} max-w-md flex-1`}
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm hover:bg-[var(--border)]"
        >
          Search
        </button>
        {search ? (
          <Link
            href={`/admin/deals?filter=${filter}`}
            className="self-center text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="mb-3 text-xs text-[var(--muted)]">
        {deals.length === 100 ? "Showing the newest 100." : `${deals.length} deal${deals.length === 1 ? "" : "s"}.`}
      </p>

      {deals.length === 0 ? (
        <EmptyState>Nothing matches.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {deals.map((deal) => (
            <li key={deal.id}>
              <AdminDealRow deal={deal} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
