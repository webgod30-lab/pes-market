import { StatGridSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { DashRailSkeleton, PageHeadSkeleton } from "@/components/dashboard/shell-skeleton";
import { Skeleton } from "@/components/ui";

/**
 * Shown while the dashboard's three queries run.
 *
 * Next.js renders this automatically for the route, so the page goes from
 * nothing to a sketch of itself rather than sitting blank — the deal list needs
 * every deal, its unread counts and its reputation before it can render a
 * single row.
 *
 * The shapes match the real page on purpose, including the sidebar rail, so
 * nothing jumps when the content arrives.
 */
export default function DashboardLoading() {
  return (
    <div className="lg:flex lg:gap-8">
      <DashRailSkeleton rows={6} />

      <div className="min-w-0 flex-1">
        <PageHeadSkeleton titleWidth="w-56" />

        <StatGridSkeleton count={4} />

        <div className="mt-8">
          <Skeleton aria-hidden="true" className="mb-3 h-4 w-24" />
          <TableSkeleton rows={4} columns={5} />
        </div>
      </div>
    </div>
  );
}
