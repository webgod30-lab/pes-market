// Password hashing. SERVER ONLY.
//
// bcryptjs (pure JavaScript) rather than native bcrypt: no compiler toolchain
// needed, which matters on Windows.
import bcrypt from "bcryptjs";

/**
 * Work factor. 12 is ~250ms per hash on modern hardware — slow enough to make
 * offline cracking expensive, fast enough for a login form.
 */
export const BCRYPT_COST = 12;

export function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

export function verifyPassword(plaintext: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, passwordHash);
}

let decoyHash: string | null = null;

/**
 * Burns roughly the same time as a real password check.
 *
 * Without this, "unknown email" returns much faster than "wrong password",
 * which lets an attacker enumerate which emails have accounts just by timing
 * the responses. Call it on the user-not-found path.
 */
export async function equalizeFailedLoginTiming(attempt: string): Promise<void> {
  decoyHash ??= await hashPassword("not-a-real-password");
  await verifyPassword(attempt, decoyHash);
}
