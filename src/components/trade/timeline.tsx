import { completedStepCount, DEAL_STEPS, isTerminalFailure } from "@/lib/deal-status";
import { cn } from "@/components/ui";
import type { DealStatus } from "@/generated/prisma/client";

/**
 * How far the deal has got, and when each part happened.
 *
 * This replaces a six-box grid that showed the step names and nothing else. Two
 * problems with that: on a phone it wrapped to six stacked boxes with no sense
 * of sequence, and it could not say *when* anything happened even though every
 * one of these timestamps is already on the deal row.
 *
 * A vertical rail fixes both. It reads top to bottom at every width, the joining
 * line makes the order explicit, and each step that has actually happened
 * carries its date. Nothing new is fetched — `stamps` comes straight from the
 * deal the page already loaded.
 *
 * A deal that ended badly stops rather than pretending to progress:
 * `completedStepCount` returns the point it stalled at, and the failure is
 * stated below the last real step instead of being drawn as a seventh one.
 */
export type TimelineStamps = {
  createdAt?: Date | null;
  inviteAcceptedAt?: Date | null;
  /** No column of its own — the deposit is proven by the payment moving on. */
  depositedAt?: Date | null;
  paymentConfirmedAt?: Date | null;
  credentialsReleasedAt?: Date | null;
  completedAt?: Date | null;
};

/** One date per step of DEAL_STEPS, in the same order. */
function stampFor(index: number, stamps: TimelineStamps): Date | null {
  return (
    [
      stamps.createdAt,
      stamps.inviteAcceptedAt,
      stamps.depositedAt,
      stamps.paymentConfirmedAt,
      stamps.credentialsReleasedAt,
      stamps.completedAt,
    ][index] ?? null
  );
}

export function DealTimeline({
  status,
  stamps = {},
}: {
  status: DealStatus;
  stamps?: TimelineStamps;
}) {
  const done = completedStepCount(status);
  const failed = isTerminalFailure(status);

  return (
    <div>
      <ol className="relative">
        {DEAL_STEPS.map((step, index) => {
          const isDone = index < done;
          // Nothing is "current" once the deal has stalled — the current thing
          // is the failure, which is stated underneath.
          const isCurrent = !failed && index === done;
          const when = isDone ? stampFor(index, stamps) : null;
          const isLast = index === DEAL_STEPS.length - 1;

          return (
            <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
              {/* The rail. Drawn per-step so it stops at the last marker
                  instead of running past it. */}
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute start-[11px] top-6 h-[calc(100%-1.5rem)] w-px",
                    isDone ? "bg-[var(--accent)]/40" : "bg-[var(--border)]",
                  )}
                />
              ) : null}

              <span
                className={cn(
                  "relative z-10 grid size-6 shrink-0 place-items-center rounded-full border text-[0.625rem] font-bold",
                  isDone
                    ? "border-transparent bg-[var(--accent)] text-[var(--background)]"
                    : isCurrent
                      ? "border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] text-[var(--tone-warning)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]",
                )}
              >
                {isDone ? <CheckIcon /> : index + 1}
              </span>

              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    "text-sm",
                    isCurrent && "font-semibold",
                    !isDone && !isCurrent && "text-[var(--muted)]",
                  )}
                >
                  {step.label}
                </p>

                {when ? (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    <time dateTime={when.toISOString()}>{when.toLocaleString("en-GB")}</time>
                  </p>
                ) : isCurrent ? (
                  <p className="mt-0.5 text-xs text-[var(--tone-warning)]">In progress</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {failed ? (
        <p
          className={cn(
            "mt-1 rounded-[var(--radius-control)] border px-3 py-2 text-xs",
            status === "disputed"
              ? "border-[var(--tone-danger-border)] bg-[var(--tone-danger-bg)] text-[var(--tone-danger)]"
              : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]",
          )}
        >
          {FAILURE_NOTE[status] ?? "This deal stopped here."}
        </p>
      ) : null}
    </div>
  );
}

const FAILURE_NOTE: Partial<Record<DealStatus, string>> = {
  disputed: "Frozen by a dispute. Nothing moves until the admin decides it.",
  refunded: "The buyer was refunded. This deal is closed.",
  cancelled: "Called off before any money moved.",
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4.5 4.5L19 7" />
    </svg>
  );
}
