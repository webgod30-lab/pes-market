import { TableSkeleton } from "@/components/dashboard/skeletons";
import { DashRailSkeleton, PageHeadSkeleton } from "@/components/dashboard/shell-skeleton";
import { Skeleton } from "@/components/ui";

/** Trade history: the rail, a heading, filter chips and the table. */
export default function TradeHistoryLoading() {
  return (
    <div className="lg:flex lg:gap-8">
      <DashRailSkeleton rows={6} />

      <div className="min-w-0 flex-1">
        <PageHeadSkeleton />

        <div aria-hidden="true" className="mb-4 flex gap-1.5">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-9 w-28" />
          ))}
        </div>

        <TableSkeleton rows={5} columns={6} />
      </div>
    </div>
  );
}
