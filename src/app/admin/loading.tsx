import { StatGridSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { DashRailSkeleton, PageHeadSkeleton } from "@/components/dashboard/shell-skeleton";
import { Skeleton } from "@/components/ui";

/**
 * Shown while the console's three queries run.
 *
 * Inherited by every /admin route, so it has to sketch the shape they share
 * rather than any one page: the rail, a heading, and a list. The overview also
 * has stat cards, and showing them here is the right trade — the hub is where
 * an admin lands, and a card grid that resolves into a card grid is better than
 * one that appears out of nowhere.
 */
export default function AdminLoading() {
  return (
    <div className="lg:flex lg:gap-8">
      <DashRailSkeleton rows={6} />

      <div className="min-w-0 flex-1">
        <PageHeadSkeleton descriptionWidth="w-80" />

        <Skeleton aria-hidden="true" className="mb-3 h-4 w-32" />
        <StatGridSkeleton count={6} />

        <div className="mt-8">
          <Skeleton aria-hidden="true" className="mb-3 h-4 w-40" />
          <TableSkeleton rows={4} columns={5} />
        </div>
      </div>
    </div>
  );
}
