import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { cn } from "@/components/ui";
import type { Tone } from "@/components/ui";

/**
 * Everything that happened to this deal, in order, with the time it happened.
 *
 * The timeline next to this shows *where the deal has got to*; this shows *what
 * was done and when*. They are different questions, and a dispute turns on the
 * second one — "the credentials went out at 14:02 and the buyer went quiet at
 * 14:03 the next day" is the sort of thing an admin has to reconstruct, and it
 * was previously scattered across a dozen separate lines of the page.
 *
 * Every entry is a timestamp already stored on the Deal row. Nothing is
 * inferred, nothing is fetched, and an event with no timestamp simply does not
 * appear — so this record can lag reality but can never invent it.
 */
export type HistoryFacts = {
  createdAt?: Date | null;
  inviteAcceptedAt?: Date | null;
  paymentSubmittedAt?: Date | null;
  paymentConfirmedAt?: Date | null;
  verificationStartedAt?: Date | null;
  deliveryApprovedAt?: Date | null;
  credentialsReleasedAt?: Date | null;
  buyerConfirmedAt?: Date | null;
  completedAt?: Date | null;
  payoutAt?: Date | null;
  refundedAt?: Date | null;
  cancelledAt?: Date | null;
};

type Entry = { at: Date; label: string; detail?: string; tone: Tone };

/**
 * The order here is the order the fields are declared, not the order the dates
 * fall in — the list is sorted by time afterwards. That matters for a deal that
 * was disputed and resumed, where the stored timestamps are not monotonic.
 */
export function historyOf(facts: HistoryFacts): Entry[] {
  const entries: (Entry | null)[] = [
    at(facts.createdAt, "Deal opened", "Terms recorded and an invite code issued.", "neutral"),
    at(facts.inviteAcceptedAt, "The other party joined", "Both sides are now on the deal.", "neutral"),
    at(facts.paymentSubmittedAt, "Buyer said they had paid", "Not yet checked by the admin.", "info"),
    at(facts.paymentConfirmedAt, "Payment confirmed and held", "The money is with the admin, not the seller.", "success"),
    at(facts.verificationStartedAt, "Admin started verifying the account", undefined, "info"),
    at(facts.deliveryApprovedAt, "Admin approved delivery", "The account matched what was promised.", "success"),
    at(facts.credentialsReleasedAt, "Credentials released to the buyer", undefined, "success"),
    at(facts.buyerConfirmedAt, "Buyer confirmed they have the account", undefined, "success"),
    at(facts.completedAt, "Deal completed", undefined, "success"),
    at(facts.payoutAt, "Payout sent to the seller", undefined, "success"),
    at(facts.refundedAt, "Buyer refunded", "The deal was reversed.", "danger"),
    at(facts.cancelledAt, "Deal cancelled", "Called off before any money moved.", "neutral"),
  ];

  return entries
    .filter((entry): entry is Entry => entry !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

function at(
  when: Date | null | undefined,
  label: string,
  detail: string | undefined,
  tone: Tone,
): Entry | null {
  return when ? { at: when, label, detail, tone } : null;
}

const DOT: Record<Tone, string> = {
  neutral: "bg-[var(--tone-neutral)]",
  info: "bg-[var(--tone-info)]",
  success: "bg-[var(--accent)]",
  warning: "bg-[var(--tone-warning)]",
  danger: "bg-[var(--tone-danger)]",
};

export function TradeHistory({ facts }: { facts: HistoryFacts }) {
  const entries = historyOf(facts);

  if (entries.length === 0) {
    return (
      <EmptyPanel icon="route" title="Nothing has happened yet">
        Events appear here as the deal moves. The record is kept whatever the outcome.
      </EmptyPanel>
    );
  }

  return (
    <ol className="relative">
      {entries.map((entry, index) => (
        <li key={`${entry.label}-${entry.at.getTime()}`} className="relative flex gap-3 pb-3 last:pb-0">
          {index < entries.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-[3.5px] top-3 h-[calc(100%-0.75rem)] w-px bg-[var(--border)]"
            />
          ) : null}

          <span
            aria-hidden="true"
            className={cn("relative z-10 mt-1.5 size-2 shrink-0 rounded-full", DOT[entry.tone])}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm">{entry.label}</p>
              <time
                dateTime={entry.at.toISOString()}
                className="shrink-0 text-xs tabular-nums text-[var(--muted)]"
              >
                {entry.at.toLocaleString("en-GB")}
              </time>
            </div>
            {entry.detail ? (
              <p className="mt-0.5 text-xs text-[var(--muted)]">{entry.detail}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
