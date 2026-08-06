import { Skeleton } from "@/components/ui";

/**
 * The parts of DashShell, sketched.
 *
 * The rail and the page heading were written out by hand in every `loading.tsx`
 * under the signed-in area — four copies of the same two shapes, already
 * drifting on the number of rows. A skeleton that does not match the component
 * it stands in for is a layout shift with extra steps, so they come from here.
 */
export function DashRailSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="mb-6 lg:mb-0 lg:w-56 lg:shrink-0">
      {/* Horizontal strip below lg, vertical rail above — the same switch the
          real rail makes. */}
      <div className="flex gap-1 lg:block lg:space-y-1">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-9 w-28 lg:w-full" />
        ))}
      </div>
    </div>
  );
}

export function PageHeadSkeleton({
  titleWidth = "w-48",
  descriptionWidth = "w-72",
}: {
  titleWidth?: string;
  descriptionWidth?: string;
}) {
  return (
    <div aria-hidden="true" className="mb-6">
      <Skeleton className={`h-8 ${titleWidth}`} />
      <Skeleton className={`mt-2 h-4 max-w-full ${descriptionWidth}`} />
    </div>
  );
}
