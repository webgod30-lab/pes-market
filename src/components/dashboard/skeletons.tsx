import { Skeleton } from "@/components/ui";

/**
 * Placeholders shaped like the thing that is coming.
 *
 * The point of a skeleton is that nothing moves when the real content lands, so
 * these deliberately mirror the components next to them in this folder — the
 * card skeleton is the height of a StatCard, the table skeleton has the same
 * header row and the same row height as DataTable. A generic grey box that is
 * the wrong height is a layout shift with extra steps.
 *
 * All of them are aria-hidden through `Skeleton`, and the region announces
 * itself once via `role="status"` rather than each bar announcing separately.
 */

export function StatCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export function StatGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading figures" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Matches DataTable: header row above, then rows of the same height. */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-label="Loading table">
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] md:block">
        <div className="flex gap-4 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className="h-3 flex-1" />
          ))}
        </div>

        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-4 last:border-0"
          >
            {Array.from({ length: columns }, (_, column) => (
              <Skeleton
                key={column}
                // Varied widths, so it reads as content rather than a grid of
                // identical bars.
                className={column === 0 ? "h-4 flex-1" : "h-4 flex-1 opacity-70"}
              />
            ))}
          </div>
        ))}
      </div>

      <ul className="space-y-2 md:hidden">
        {Array.from({ length: Math.min(rows, 3) }, (_, index) => (
          <li
            key={index}
            className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** For the stacked deal cards on the trader dashboard. */
export function DealListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul role="status" aria-label="Loading deals" className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <li
          key={index}
          className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2.5 h-3 w-full max-w-sm" />
              <Skeleton className="mt-1.5 h-3 w-2/3 max-w-xs" />
            </div>
            <div className="shrink-0 text-right">
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="ml-auto mt-2 h-5 w-24" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
