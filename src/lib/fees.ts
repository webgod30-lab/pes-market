// Middleman commission.
//
// The rate is kept in basis points (1 bp = 0.01%), so 500 = 5%. Integers only:
// a percentage stored as 0.05 would drift once you start multiplying money by
// it. The rate is snapshotted onto each deal at creation, so changing it later
// never rewrites the terms of a deal already in progress.

/** 500 bp = 5%. Override with DEFAULT_FEE_BPS in .env; set 0 to take no fee. */
const FALLBACK_FEE_BPS = 500;

export function defaultFeeBps(): number {
  const raw = process.env.DEFAULT_FEE_BPS;

  if (raw === undefined || raw.trim() === "") return FALLBACK_FEE_BPS;

  const parsed = Number(raw);

  // A bad value should be loud, not silently treated as "no fee".
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10_000) {
    throw new Error(
      `DEFAULT_FEE_BPS must be a whole number of basis points between 0 and 10000 (500 = 5%). Got "${raw}".`,
    );
  }

  return parsed;
}

export type DealMoney = {
  /** What the buyer pays. */
  agreedPriceCents: number;
  /** Your commission. */
  feeCents: number;
  /** What the seller receives. */
  sellerPayoutCents: number;
  feeBps: number;
};

/**
 * Splits the agreed price into your fee and the seller's payout.
 * The fee is rounded to the nearest cent, and the seller gets the remainder, so
 * fee + payout always equals the price exactly — no missing cent.
 */
export function splitDealMoney(agreedPriceCents: number, feeBps: number): DealMoney {
  if (!Number.isInteger(agreedPriceCents) || agreedPriceCents <= 0) {
    throw new Error("agreedPriceCents must be a positive whole number of cents.");
  }

  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new Error("feeBps must be a whole number between 0 and 10000.");
  }

  const feeCents = Math.round((agreedPriceCents * feeBps) / 10_000);

  return {
    agreedPriceCents,
    feeBps,
    feeCents,
    sellerPayoutCents: agreedPriceCents - feeCents,
  };
}

/** 500 -> "5%", 250 -> "2.5%" */
export function formatFeeBps(feeBps: number): string {
  return `${(feeBps / 100).toFixed(feeBps % 100 === 0 ? 0 : 1)}%`;
}
