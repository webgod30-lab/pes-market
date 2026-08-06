import { DashRailSkeleton, PageHeadSkeleton } from "@/components/dashboard/shell-skeleton";
import { Skeleton } from "@/components/ui";

/**
 * Shown while the balance, the earnings and the withdrawals load.
 *
 * The big number is sketched at the size it will be. Money jumping from a
 * small placeholder to a large figure is the one layout shift on this page
 * that would actually be read as the balance changing.
 */
export default function WalletLoading() {
  return (
    <div className="lg:flex lg:gap-8">
      <DashRailSkeleton rows={6} />

      <div className="min-w-0 flex-1" role="status" aria-label="Loading your balance">
        <PageHeadSkeleton titleWidth="w-44" />

        <div className="max-w-3xl">
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="mt-2 h-10 w-48" />
            <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>

          {[0, 1].map((index) => (
            <div
              key={index}
              className="mt-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
