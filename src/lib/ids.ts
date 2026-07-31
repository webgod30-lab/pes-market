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
