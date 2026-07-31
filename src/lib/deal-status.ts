// Human labels for the escrow lifecycle, plus whose turn it is.
//
// Kept in one place so the dashboard, the admin console and (later) the deal
// page all describe a status the same way.
import type { DealStatus } from "@/generated/prisma/client";
import type { Tone } from "@/components/ui";

export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
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

/** Who has to do something next. "counterparty" means the invite is outstanding. */
export type NextActor = "seller" | "buyer" | "admin" | "counterparty" | null;

export function nextActorFor(status: DealStatus): NextActor {
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

/** The happy path, for the progress timeline on a deal page. */
export const DEAL_STEPS = [
  { key: "opened", label: "Deal opened" },
  { key: "joined", label: "Both parties in" },
  { key: "deposited", label: "Account deposited" },
  { key: "held", label: "Payment held" },
  { key: "released", label: "Credentials released" },
  { key: "paid", label: "Seller paid" },
] as const;

/**
 * How many of DEAL_STEPS are finished. A deal that ended badly (cancelled,
 * refunded) returns the point it stopped at rather than pretending to progress.
 */
export function completedStepCount(status: DealStatus): number {
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
