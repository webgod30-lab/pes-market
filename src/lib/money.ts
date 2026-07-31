// Money helpers.
//
// Prices are stored as integer minor units ("cents"), never as floats. 19.99 is
// not representable in binary floating point, so summing float prices drifts.
// Integers also cross the server/client boundary cleanly, unlike Prisma's
// Decimal type, which React cannot serialize into a client component.

/** 1999 -> "$19.99" */
export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** "19.99" or "19,99" -> 1999. Returns null if it isn't a sane price. */
export function parsePriceToCents(input: string): number | null {
  const normalized = input.trim().replace(",", ".");

  if (!/^\d{1,7}(\.\d{1,2})?$/.test(normalized)) return null;

  // Round to kill binary float error: 19.99 * 100 === 1998.9999999999998
  const cents = Math.round(Number(normalized) * 100);

  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
