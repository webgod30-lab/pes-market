import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listDealsForAdmin, type DealFilter } from "@/lib/admin";
import { DEAL_STATUS_LABEL } from "@/lib/deal-status";
import { adminSections } from "@/components/dashboard/dash-nav";
import { adminDealColumns } from "@/components/dashboard/admin-deal-columns";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { FilterChips } from "@/components/dashboard/filter-chips";
import { Button, inputClassName, SearchInput, SetupProblem } from "@/components/ui";

export const metadata = { title: "Deals — admin" };

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
    <DashShell
      groups={adminSections({
        // Only meaningful on the default filter — the badge means "work
        // waiting", not "rows currently on screen".
        deals: filter === "needs_action" && !search ? deals.length : undefined,
      })}
      title="Deals"
      description="Every trade on the service."
    >
      {/* Plain links rather than a client-side control: the filter belongs in
          the URL so it can be linked to from the overview cards. */}
      <FilterChips
        options={FILTERS.map((option) => ({
          label: option.label,
          href: `/admin/deals?filter=${option.value}${search ? `&q=${encodeURIComponent(search)}` : ""}`,
          active: filter === option.value,
        }))}
      />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="filter" value={filter} />
        <SearchInput
          label="Search deals"
          name="q"
          defaultValue={search}
          placeholder="Search reference, description or a person's name"
          className={`${inputClassName} max-w-md flex-1`}
        />
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
        {search ? (
          <Link
            href={`/admin/deals?filter=${filter}`}
            className="inline-flex min-h-9 items-center self-center text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="mb-3 text-xs text-[var(--muted)]">
        {deals.length === 100
          ? "Showing the newest 100."
          : `${deals.length} deal${deals.length === 1 ? "" : "s"}.`}
      </p>

      <DataTable
        caption="Deals matching the current filter"
        rows={deals}
        rowKey={(deal) => deal.id}
        rowHref={(deal) => `/admin/deals/${deal.id}`}
        columns={adminDealColumns(now)}
        empty={
          <EmptyPanel
            icon="folder"
            title={search ? "Nothing matches that search" : "Nothing in this filter"}
            secondaryAction={
              search || filter !== "all"
                ? { href: "/admin/deals?filter=all", label: "Show all deals" }
                : undefined
            }
          >
            {search
              ? "Try a reference, part of an account description, or either person's display name."
              : "Deals appear here as soon as they reach this stage."}
          </EmptyPanel>
        }
      />
    </DashShell>
  );
}
