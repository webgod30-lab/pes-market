import { completedStepCount, DEAL_STEPS, isTerminalFailure } from "@/lib/deal-status";
import type { DealStatus } from "@/generated/prisma/client";

/** Where the deal has got to along the happy path. */
export function DealTimeline({ status }: { status: DealStatus }) {
  if (isTerminalFailure(status)) return null;

  const done = completedStepCount(status);

  return (
    <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {DEAL_STEPS.map((step, index) => {
        const isDone = index < done;
        const isCurrent = index === done;

        return (
          <li
            key={step.key}
            className={`rounded-lg border p-3 ${
              isDone
                ? "border-emerald-500/30 bg-emerald-500/10"
                : isCurrent
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-[var(--border)] bg-[var(--surface-2)]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                  isDone
                    ? "bg-emerald-500 text-emerald-950"
                    : isCurrent
                      ? "bg-amber-400 text-amber-950"
                      : "bg-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span
                className={`text-xs font-medium ${
                  isDone || isCurrent ? "" : "text-[var(--muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
