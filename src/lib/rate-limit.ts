// Brute-force protection for the auth routes. SERVER ONLY.
//
// A fixed-window counter kept in the database. In-memory would be worse than
// useless on serverless: each instance would count separately, so the real
// limit would be whatever we configured multiplied by however many instances
// happen to be warm.
//
// Two limits are always applied together, and they defend against different
// attacks:
//
//   by account — someone guessing one person's password. Strict.
//   by IP      — someone spraying one common password across many accounts,
//                which the per-account limit would never notice. Looser,
//                because a school, office or phone network shares an address.
import { prisma } from "@/lib/prisma";

export type RateLimitRule = {
  /** Attempts allowed inside one window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
};

export type RateLimitVerdict =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Signing in.
 *
 * Ten per account per fifteen minutes is far above what a person who has
 * simply forgotten which password they used will hit, and far below what makes
 * guessing viable. The IP limit is deliberately much looser so a shared network
 * does not lock out an entire office because one person fumbled their password.
 */
export const LOGIN_BY_ACCOUNT: RateLimitRule = { limit: 10, windowSeconds: 15 * 60 };
export const LOGIN_BY_IP: RateLimitRule = { limit: 50, windowSeconds: 15 * 60 };

/**
 * Creating accounts. Purely per-IP — there is no account to key on yet.
 * Low, because a real person signs up once.
 */
export const REGISTER_BY_IP: RateLimitRule = { limit: 5, windowSeconds: 60 * 60 };

/** Two-factor codes, which are six digits and therefore guessable at volume. */
export const TOTP_BY_ACCOUNT: RateLimitRule = { limit: 8, windowSeconds: 10 * 60 };

function windowStartFor(rule: RateLimitRule, now: Date): Date {
  const ms = rule.windowSeconds * 1000;

  return new Date(Math.floor(now.getTime() / ms) * ms);
}

/**
 * Records one attempt against `key` and says whether it is allowed.
 *
 * Call this for the attempt itself, not after deciding it failed — a limiter
 * that only counts failures lets an attacker who occasionally guesses right
 * keep going indefinitely.
 */
export async function hitRateLimit(
  key: string,
  rule: RateLimitRule,
  now = new Date(),
): Promise<RateLimitVerdict> {
  const windowStart = windowStartFor(rule, now);
  const windowEnd = new Date(windowStart.getTime() + rule.windowSeconds * 1000);

  // Upsert with an atomic increment: two requests racing cannot both read the
  // same count and write it back, which is exactly the case an attacker
  // creates by firing attempts in parallel.
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1, expiresAt: windowEnd },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (bucket.count > rule.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowEnd.getTime() - now.getTime()) / 1000)),
    };
  }

  return { allowed: true, remaining: rule.limit - bucket.count };
}

/**
 * Applies several limits at once and reports the first that is exhausted.
 *
 * Every rule is hit, not just up to the first failure: if we stopped early, an
 * attacker who tripped the per-account limit would stop accumulating against
 * the per-IP limit and could rotate accounts for free.
 */
export async function hitRateLimits(
  entries: { key: string; rule: RateLimitRule }[],
  now = new Date(),
): Promise<RateLimitVerdict> {
  const verdicts = await Promise.all(entries.map((e) => hitRateLimit(e.key, e.rule, now)));

  const blocked = verdicts.filter((v): v is Extract<RateLimitVerdict, { allowed: false }> => !v.allowed);

  if (blocked.length > 0) {
    return blocked.reduce((worst, v) => (v.retryAfterSeconds > worst.retryAfterSeconds ? v : worst));
  }

  const remaining = verdicts.map((v) => (v.allowed ? v.remaining : 0));

  return { allowed: true, remaining: Math.min(...remaining) };
}

/** Human-readable wait, for the message shown to whoever is locked out. */
export function describeRetryAfter(seconds: number): string {
  if (seconds < 60) return "less than a minute";

  const minutes = Math.ceil(seconds / 60);

  return minutes === 1 ? "a minute" : `${minutes} minutes`;
}

/**
 * Clears the counters for one account after a genuine success.
 *
 * Without this, someone who mistypes their password nine times and then gets
 * it right stays one attempt from a lockout for the rest of the window.
 * Deliberately does not clear the IP counter: a successful login on one
 * account should not reset the budget for spraying others.
 */
export async function clearRateLimit(key: string): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({ where: { key } });
}

/** Drops windows that have closed. Safe to run at any time. */
export function pruneRateLimits(now = new Date()): Promise<{ count: number }> {
  return prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } });
}
