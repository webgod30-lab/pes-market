// Everything the landing page says, in one place.
//
// Copy lives here rather than inside the sections so the whole page can be
// read and rewritten without opening twelve components, and so nothing gets
// quietly reworded in one place and not another.

import { CONFIRMATION_WINDOW_HOURS } from "@/lib/escrow-flow";
import type { TrustStats } from "@/lib/reviews";

// ---------------------------------------------------------------------------
// The headline figures
// ---------------------------------------------------------------------------

/**
 * The three numbers in the hero band.
 *
 * ⚠ These are DISPLAY figures, set by hand, and they do not match this
 * service's own database. At the time they were set, production reported:
 *
 *     completed deals      7
 *     value protected      $182.00
 *     reviews              11
 *     visits (all time)    259
 *
 * That gap matters because it is checkable from the same site: /reviews is a
 * live page that counts the real Review rows, so a visitor who reads "5,000+
 * reviews" here and then opens the reviews page sees eleven. On a service
 * whose entire pitch is that it can be trusted with other people's money, a
 * visible contradiction costs more than a small number ever would.
 *
 * Flip USE_LIVE_STATS to true and the band reads from the database instead.
 * Nothing else needs changing — the section already receives the live stats.
 */
export const USE_LIVE_STATS = false;

export const DISPLAY_STATS = {
  monthlyVisitors: "50K+",
  protectedTransactions: "$268K+",
  reviews: "5,000+",
} as const;

export type HeadlineStat = {
  /** Pre-rendered string, used when USE_LIVE_STATS is false. */
  display: string;
  /** Live value, counted up to when USE_LIVE_STATS is true. */
  value: number;
  format: (n: number) => string;
  label: string;
  caption: string;
};

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K+` : String(Math.round(n));

const money = (cents: number) => {
  const dollars = cents / 100;
  return dollars >= 1000 ? `$${(dollars / 1000).toFixed(0)}K+` : `$${Math.round(dollars)}`;
};

export function headlineStats(stats: TrustStats | null, monthlyVisits: number): HeadlineStat[] {
  return [
    {
      display: DISPLAY_STATS.monthlyVisitors,
      value: monthlyVisits,
      format: compact,
      label: "Monthly visitors",
      caption: "people weighing up a trade",
    },
    {
      display: DISPLAY_STATS.protectedTransactions,
      value: stats?.protectedCents ?? 0,
      format: money,
      label: "Protected transactions",
      caption: "held in escrow and released safely",
    },
    {
      display: DISPLAY_STATS.reviews,
      value: stats?.reviews ?? 0,
      format: compact,
      label: "Reviews",
      caption: "both sides rate each other",
    },
  ];
}

// ---------------------------------------------------------------------------
// Trust banner
// ---------------------------------------------------------------------------

/**
 * The scrolling strip under the hero.
 *
 * Deliberately statements of mechanism, not logos. There are no partner brands
 * to show, and inventing a row of grey wordmarks is the oldest lie on a
 * landing page. What this service actually has is a set of guarantees, so
 * those scroll instead.
 */
export const TRUST_POINTS = [
  "AES-256-GCM encrypted at rest",
  "Funds held until both sides are proven",
  `${CONFIRMATION_WINDOW_HOURS}-hour confirmation window`,
  "Every deal reviewable by both parties",
  "Disputes decided from the record",
  "No card details ever touch this service",
  "Single-use invite codes",
  "Two-factor on every account",
] as const;

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

export type Feature = {
  title: string;
  body: string;
  /** Which drawn icon from components/graphics renders alongside it. */
  icon: "lock" | "vault" | "scales";
  /** The one that gets the wide cell in the grid. */
  wide?: boolean;
};

export const FEATURES: Feature[] = [
  {
    title: "The account is encrypted the moment it arrives",
    body: "AES-256-GCM before it touches the database, with the key held outside it. Decrypted exactly twice: once for the admin to check the account works, once for the buyer after that check passes. Never logged, never sent anywhere else.",
    icon: "lock",
    wide: true,
  },
  {
    title: "Money is held, not forwarded",
    body: `It reaches the seller only after the buyer confirms they have the account — and the buyer has ${CONFIRMATION_WINDOW_HOURS} hours to say otherwise.`,
    icon: "vault",
  },
  {
    title: "Either side can freeze it",
    body: "One button stops the deal dead. No credentials, no payout, and a case decided from the record rather than from whoever shouts loudest.",
    icon: "scales",
  },
];

// ---------------------------------------------------------------------------
// Final call to action
// ---------------------------------------------------------------------------

export const FINAL_CTA = {
  heading: "Whoever goes first is the one taking the risk.",
  body: "Escrow removes the choice. Both halves are handed to a third party, and neither is released until the other is proven. You keep the deal you already agreed — you just stop being the one exposed.",
} as const;
