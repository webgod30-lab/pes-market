// Human labels for the escrow lifecycle, plus whose turn it is.
//
// Kept in one place so the dashboard, the admin console and (later) the deal
// page all describe a status the same way.
import type { DealStatus, TradeKind } from "@/generated/prisma/client";
import type { MessageKey } from "@/lib/dictionary";
import type { Locale } from "@/lib/locale";
import type { Tone } from "@/components/ui";

const dealStatusLabelEn: Record<DealStatus, string> = {
  awaiting_counterparty: "Waiting for the other party",
  awaiting_credentials: "Waiting for account details",
  awaiting_payment: "Waiting for payment",
  payment_submitted: "Payment under review",
  admin_verifying: "Admin verifying the account",
  credentials_released: "Credentials released",
  claiming: "Buyer claiming the account",
  completed: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const dealStatusLabelAr: Record<DealStatus, string> = {
  awaiting_counterparty: "بانتظار الطرف الآخر",
  awaiting_credentials: "بانتظار بيانات الحساب",
  awaiting_payment: "بانتظار الدفع",
  payment_submitted: "الدفع قيد المراجعة",
  admin_verifying: "المشرف يتحقق من الحساب",
  credentials_released: "تم تسليم بيانات الحساب",
  claiming: "المشتري يستلم الحساب",
  completed: "مكتملة",
  disputed: "متنازع عليها",
  refunded: "مستردة",
  cancelled: "ملغاة",
};

export function dealStatusLabel(locale: Locale = "en"): Record<DealStatus, string> {
  return locale === "ar" ? dealStatusLabelAr : dealStatusLabelEn;
}

export const DEAL_STATUS_TONE: Record<DealStatus, Tone> = {
  awaiting_counterparty: "neutral",
  awaiting_credentials: "warning",
  awaiting_payment: "warning",
  payment_submitted: "info",
  admin_verifying: "info",
  credentials_released: "success",
  claiming: "success",
  completed: "success",
  disputed: "danger",
  refunded: "neutral",
  cancelled: "neutral",
};

/**
 * Who has to do something next. "counterparty" means the invite is outstanding;
 * "both" only happens on a swap, where the two sides deposit and confirm in
 * parallel rather than taking turns.
 */
export type NextActor = "seller" | "buyer" | "admin" | "counterparty" | "both" | null;

export function nextActorFor(status: DealStatus, tradeKind: TradeKind = "cash"): NextActor {
  // A swap is symmetric: both parties deposit an account, and both confirm they
  // received one. Saying "waiting on the buyer" there would tell the seller
  // their own outstanding action was somebody else's job.
  if (tradeKind === "swap") {
    switch (status) {
      case "awaiting_credentials":
      case "credentials_released":
      case "claiming":
        return "both";
      default:
        break;
    }
  }

  switch (status) {
    case "awaiting_counterparty":
      return "counterparty";
    case "awaiting_credentials":
      return "seller";
    case "awaiting_payment":
    case "credentials_released":
    case "claiming":
      return "buyer";
    case "payment_submitted":
    case "admin_verifying":
    case "disputed":
      return "admin";
    case "completed":
    case "refunded":
    case "cancelled":
      return null;
  }
}

/**
 * Whether it is this side's move. Use this rather than comparing `nextActorFor`
 * to a side directly — on a swap the answer is "both", which no single side
 * name equals.
 */
export function isTurnOf(
  status: DealStatus,
  side: "seller" | "buyer" | null | undefined,
  tradeKind: TradeKind = "cash",
): boolean {
  if (!side) return false;
  const actor = nextActorFor(status, tradeKind);
  return actor === side || actor === "both";
}

/** The happy path, for the progress timeline on a deal page. */
export const DEAL_STEPS = [
  { key: "opened", labelKey: "step.opened" },
  { key: "joined", labelKey: "step.joined" },
  { key: "deposited", labelKey: "step.deposited" },
  { key: "held", labelKey: "step.held" },
  { key: "released", labelKey: "step.released" },
  { key: "paid", labelKey: "step.paid" },
] as const satisfies readonly Step[];

/**
 * The same path for a swap. There is no money, so the two payment steps are
 * replaced by the one thing a swap waits on instead: the second account.
 */
export const SWAP_STEPS = [
  { key: "opened", labelKey: "step.opened" },
  { key: "joined", labelKey: "step.joined" },
  { key: "deposited", labelKey: "step.bothDeposited" },
  { key: "checked", labelKey: "step.checked" },
  { key: "released", labelKey: "step.swapped" },
] as const satisfies readonly Step[];

/**
 * A step names itself by dictionary key rather than by English text, so the
 * timeline can render in whichever language the reader chose.
 */
export type Step = { key: string; labelKey: MessageKey };

export function stepsFor(tradeKind: TradeKind): readonly Step[] {
  return tradeKind === "swap" ? SWAP_STEPS : DEAL_STEPS;
}

/**
 * How many of the steps are finished. A deal that ended badly (cancelled,
 * refunded) returns the point it stopped at rather than pretending to progress.
 */
export function completedStepCount(status: DealStatus, tradeKind: TradeKind = "cash"): number {
  if (tradeKind === "swap") {
    switch (status) {
      case "awaiting_counterparty":
        return 1;
      // Both sides deposit here; the status only advances once the second one
      // lands, so this single step covers the whole exchange of accounts.
      case "awaiting_credentials":
      case "awaiting_payment":
      case "payment_submitted":
        return 2;
      case "admin_verifying":
        return 3;
      case "credentials_released":
      case "claiming":
        return 4;
      case "completed":
        return 5;
      case "disputed":
      case "refunded":
      case "cancelled":
        return 0;
    }
  }

  switch (status) {
    case "awaiting_counterparty":
      return 1;
    case "awaiting_credentials":
      return 2;
    // Payment submitted still counts as "not held" — it is held only once the
    // admin confirms the money actually arrived.
    case "awaiting_payment":
    case "payment_submitted":
      return 3;
    case "admin_verifying":
      return 4;
    case "credentials_released":
    case "claiming":
      return 5;
    case "completed":
      return 6;
    case "disputed":
    case "refunded":
    case "cancelled":
      return 0;
  }
}

/** Deals that ended without completing. */
export function isTerminalFailure(status: DealStatus): boolean {
  return status === "cancelled" || status === "refunded" || status === "disputed";
}

/** Statuses where the admin has something in their queue. */
export const ADMIN_ACTION_STATUSES: DealStatus[] = [
  "payment_submitted",
  "admin_verifying",
  "disputed",
];

/**
 * Statuses before any money has been sent. A deal can still be called off here
 * without anyone being out of pocket; after this, cancelling means a refund,
 * which is an admin decision.
 */
export const PRE_PAYMENT_STATUSES: DealStatus[] = [
  "awaiting_counterparty",
  "awaiting_credentials",
  "awaiting_payment",
];

/** Statuses where the deal is still live (not finished, not cancelled). */
export const OPEN_STATUSES: DealStatus[] = [
  "awaiting_counterparty",
  "awaiting_credentials",
  "awaiting_payment",
  "payment_submitted",
  "admin_verifying",
  "credentials_released",
  "claiming",
  "disputed",
];
