import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listDealsForAdmin, type DealFilter } from "@/lib/admin";
import { dealStatusLabel } from "@/lib/deal-status";
import { adminSections } from "@/components/dashboard/dash-nav";
import { adminDealColumns } from "@/components/dashboard/admin-deal-columns";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { FilterChips } from "@/components/dashboard/filter-chips";
import { Button, inputClassName, SearchInput, SetupProblem } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { ADMIN_DEALS_PAGE } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";

export const metadata = { title: "Deals — admin" };

function filtersFor(locale: Locale): { value: DealFilter; label: string }[] {
  const copy = ADMIN_DEALS_PAGE[locale];
  const status = dealStatusLabel(locale);

  return [
    { value: "needs_action", label: copy.filterNeedsAction },
    { value: "open", label: copy.filterInFlight },
    { value: "all", label: copy.filterAll },
    { value: "disputed", label: status.disputed },
    { value: "payment_submitted", label: status.payment_submitted },
    { value: "admin_verifying", label: status.admin_verifying },
    { value: "claiming", label: status.claiming },
    { value: "completed", label: status.completed },
    { value: "refunded", label: status.refunded },
    { value: "cancelled", label: status.cancelled },
  ];
}

function isFilter(value: string | undefined, filters: { value: DealFilter }[]): value is DealFilter {
  return filters.some((f) => f.value === value);
}

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const auth = await requireUserOrProblem(["admin"], "/admin/deals");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const locale = await getLocale();
  const copy = ADMIN_DEALS_PAGE[locale];
  const FILTERS = filtersFor(locale);

  const params = await searchParams;
  const filter: DealFilter = isFilter(params.filter, FILTERS) ? params.filter : "needs_action";
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
      title={copy.title}
      description={copy.description}
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
          label={copy.searchLabel}
          name="q"
          defaultValue={search}
          placeholder={copy.searchPlaceholder}
          className={`${inputClassName} max-w-md flex-1`}
        />
        <Button type="submit" variant="secondary" size="sm">
          {copy.search}
        </Button>
        {search ? (
          <Link
            href={`/admin/deals?filter=${filter}`}
            className="inline-flex min-h-9 items-center self-center text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {copy.clear}
          </Link>
        ) : null}
      </form>

      <p className="mb-3 text-xs text-[var(--muted)]">
        {deals.length === 100 ? copy.showingNewest : copy.dealCount(deals.length)}
      </p>

      <DataTable
        caption={copy.tableCaption}
        rows={deals}
        rowKey={(deal) => deal.id}
        rowHref={(deal) => `/admin/deals/${deal.id}`}
        columns={adminDealColumns(now, locale)}
        empty={
          <EmptyPanel
            icon="folder"
            title={search ? copy.noMatchTitle : copy.noneInFilterTitle}
            secondaryAction={
              search || filter !== "all"
                ? { href: "/admin/deals?filter=all", label: copy.showAllDeals }
                : undefined
            }
          >
            {search ? copy.tryLead : copy.appearHere}
          </EmptyPanel>
        }
      />
    </DashShell>
  );
}
