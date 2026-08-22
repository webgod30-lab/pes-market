import { DEAL_STATUS_TONE, dealStatusLabel, isTurnOf, nextActorFor } from "@/lib/deal-status";
import { cn, TONE_SURFACE, type Tone } from "@/components/ui";
import type { DealSide, DealStatus, TradeKind } from "@/generated/prisma/client";
import type { Locale } from "@/lib/locale";

const TURN_BADGE_TEXT: Record<Locale, { yourTurn: string; withAdmin: string; waitingCounterparty: string; waitingOther: string }> = {
  en: {
    yourTurn: "Your turn",
    withAdmin: "With the admin",
    waitingCounterparty: "Waiting for them to join",
    waitingOther: "Waiting on the other person",
  },
  ar: {
    yourTurn: "دورك الآن",
    withAdmin: "لدى المشرف",
    waitingCounterparty: "بانتظار انضمامهم",
    waitingOther: "بانتظار الطرف الآخر",
  },
};

/**
 * The status of a deal, said properly.
 *
 * A plain `<Badge>` with the status label was doing two jobs badly. "Waiting
 * for payment" is a fact about the deal; whether *you* are the one holding it
 * up is the thing a party actually wants to know, and that depends on which
 * side they are on. So the badge takes the viewer's side and says so.
 *
 * The dot is not decoration. Colour alone cannot carry meaning — a red badge
 * and an amber badge are the same badge to a lot of people — so the shape of
 * the dot changes too: a ring while something is pending, filled once it is
 * settled, and a pulse when it is you being waited on.
 */
export function StatusBadge({
  status,
  side,
  size = "md",
  tradeKind = "cash",
  locale = "en",
}: {
  status: DealStatus;
  /** The viewer's side, when they are a party. Omitted for the admin view. */
  side?: DealSide;
  size?: "sm" | "md";
  /** A swap waits on both sides at once, which changes whose turn it is. */
  tradeKind?: TradeKind;
  locale?: Locale;
}) {
  const tone = DEAL_STATUS_TONE[status];
  const yourTurn = isTurnOf(status, side, tradeKind);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border font-medium",
        TONE_SURFACE[tone],
        size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-1 text-xs",
      )}
    >
      <StatusDot tone={tone} pulse={yourTurn} settled={isSettled(status)} />
      {dealStatusLabel(locale)[status]}
    </span>
  );
}

/** A deal that has stopped moving, one way or the other. */
function isSettled(status: DealStatus): boolean {
  return status === "completed" || status === "refunded" || status === "cancelled";
}

function StatusDot({
  tone,
  pulse,
  settled,
}: {
  tone: Tone;
  pulse: boolean;
  settled: boolean;
}) {
  return (
    <span aria-hidden="true" className="relative grid size-2 shrink-0 place-items-center">
      {pulse ? (
        <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
      ) : null}
      <span
        className={cn(
          "size-2 rounded-full",
          // Filled once nothing more will happen; a ring while it is still in
          // play. Readable without relying on the colour.
          settled ? "bg-current" : "border-[1.5px] border-current",
          tone === "neutral" && "opacity-70",
        )}
      />
    </span>
  );
}

/**
 * "Your turn" / "waiting on them", as a separate line.
 *
 * Kept apart from the status badge on purpose: the status is what the deal is,
 * this is what you should do about it, and squashing both into one pill makes a
 * label long enough that it wraps on a phone.
 */
export function TurnBadge({
  status,
  side,
  tradeKind = "cash",
  locale = "en",
}: {
  status: DealStatus;
  side: DealSide;
  tradeKind?: TradeKind;
  locale?: Locale;
}) {
  const actor = nextActorFor(status, tradeKind);
  const say = TURN_BADGE_TEXT[locale];

  if (actor === side || actor === "both") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--tone-warning)]">
        <span aria-hidden="true" className="relative grid size-2 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
          <span className="size-2 rounded-full bg-current" />
        </span>
        {say.yourTurn}
      </span>
    );
  }

  if (actor === "admin") return <Waiting>{say.withAdmin}</Waiting>;

  // null means the deal has stopped — settled, refunded or cancelled. Nobody is
  // being waited on, so saying "waiting" would be wrong.
  if (actor === null) return null;

  if (actor === "counterparty") return <Waiting>{say.waitingCounterparty}</Waiting>;

  return <Waiting>{say.waitingOther}</Waiting>;
}

function Waiting({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]">
      <span aria-hidden="true" className="size-2 rounded-full border-[1.5px] border-current" />
      {children}
    </span>
  );
}
