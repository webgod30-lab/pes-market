// Human-facing references and invite codes. SERVER ONLY.
import { randomBytes, randomInt } from "node:crypto";

/**
 * Deliberately excludes I, L, O, 0 and 1 — a deal reference gets read aloud and
 * retyped in a chat window, and those are the characters people get wrong.
 */
const READABLE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Short reference both parties can quote: "ESC-7F3K9Q".
 * 31^6 ≈ 887 million combinations. It is not a secret — it identifies a deal,
 * it does not grant access to one. Uniqueness is enforced by the database, so
 * retry on a unique-constraint violation.
 */
export function generateDealReference(): string {
  let suffix = "";

  for (let i = 0; i < 6; i++) {
    // randomInt, not Math.random: no reason to use a weak generator here.
    suffix += READABLE_ALPHABET[randomInt(READABLE_ALPHABET.length)];
  }

  return `ESC-${suffix}`;
}

/**
 * The invite code IS a secret: whoever holds it can join the deal as the open
 * side. 24 random bytes, url-safe. Long enough that guessing is hopeless.
 */
export function generateInviteCode(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * A promoter's referral code: "PES-7F3K9Q".
 *
 * Same readable alphabet as a deal reference, and for a stronger reason — this
 * one gets said out loud in a Discord voice channel and typed into a sign-up
 * form by someone who has never seen it written down. A code containing both O
 * and 0 would cost real sign-ups.
 *
 * Not a secret: it identifies a promoter and grants nothing. Uniqueness is
 * enforced by the database, so callers retry on a unique-constraint violation.
 */
export function generateReferralCode(): string {
  let suffix = "";

  for (let i = 0; i < 6; i++) {
    suffix += READABLE_ALPHABET[randomInt(READABLE_ALPHABET.length)];
  }

  return `PES-${suffix}`;
}

/**
 * Puts a typed code into the one form stored in the database.
 *
 * People paste these with a trailing space from a chat message, in lower case,
 * and often without the "PES-" because they only copied the interesting half.
 * All three should find the promoter rather than reporting an invalid code, so
 * the prefix is re-added rather than demanded.
 */
export function normaliseReferralCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, "");

  if (trimmed === "") return "";

  return trimmed.startsWith("PES-") ? trimmed : `PES-${trimmed.replace(/^PES/, "")}`;
}
