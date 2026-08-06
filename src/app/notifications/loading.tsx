import { DashRailSkeleton, PageHeadSkeleton } from "@/components/dashboard/shell-skeleton";
import { Skeleton } from "@/components/ui";

/** Notifications: the rail, a heading, then a short stack of item rows. */
export default function NotificationsLoading() {
  return (
    <div className="lg:flex lg:gap-8">
      <DashRailSkeleton rows={6} />

      <div className="min-w-0 flex-1" role="status" aria-label="Loading notifications">
        <PageHeadSkeleton titleWidth="w-44" descriptionWidth="w-64" />

        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <Skeleton className="size-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
