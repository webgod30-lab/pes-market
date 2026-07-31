// Encryption for account credentials.
//
// SERVER ONLY. This module imports node:crypto — never import it from a client
// component.
//
// An account login is the entire thing being escrowed here, so it is never
// stored in plaintext. We use AES-256-GCM, which is authenticated: if a
// ciphertext is tampered with in the database, decryption throws instead of
// returning wrong-but-plausible data.
//
// Stored format:  v1:<iv-b64>:<authTag-b64>:<ciphertext-b64>
// The "v1" prefix means we can migrate to a new scheme later without guessing
// how an old row was encrypted.
//
// RULES
//   - Never log the plaintext or the return value of decryptCredentials().
//   - Never send credentials to a buyer before the admin approves delivery.
//   - Losing CREDENTIALS_ENCRYPTION_KEY means losing every stored credential.
//     It is not recoverable. Back it up somewhere safe.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32; // AES-256
const IV_BYTES = 12; // 96-bit nonce, the standard size for GCM
const VERSION = "v1";

/** The shape that gets encrypted into a Credential row. */
export const credentialDataSchema = z.object({
  /** Login email or username for the game account. */
  loginEmail: z.string().min(1, "Account login is required"),
  /** Password for the game account. */
  loginPassword: z.string().min(1, "Account password is required"),
  /** Email inbox tied to the account, if the seller hands it over too. */
  recoveryEmail: z.string().optional().default(""),
  /** Password for that inbox. */
  recoveryEmailPassword: z.string().optional().default(""),
  /** Anything else the buyer needs: 2FA backup codes, console linked, etc. */
  notes: z.string().optional().default(""),
});

export type CredentialData = z.infer<typeof credentialDataSchema>;

let cachedKey: Buffer | null = null;

/**
 * Reads and validates CREDENTIALS_ENCRYPTION_KEY (64 hex characters = 32 bytes).
 * Generate one with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not set. See .env.example — it must be 64 hex characters.",
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(raw.trim())) {
    throw new Error(
      `CREDENTIALS_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes), got ${raw.trim().length} characters. ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }

  const key = Buffer.from(raw.trim(), "hex");

  if (key.length !== KEY_BYTES) {
    throw new Error(`CREDENTIALS_ENCRYPTION_KEY decoded to ${key.length} bytes, expected ${KEY_BYTES}.`);
  }

  cachedKey = key;
  return key;
}

/** Encrypts a UTF-8 string. Returns the versioned, self-describing payload. */
export function encryptString(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ":",
  );
}

/** Reverses encryptString. Throws if the key is wrong or the row was tampered with. */
export function decryptString(payload: string): string {
  const parts = payload.split(":");

  if (parts.length !== 4) {
    throw new Error("Malformed ciphertext: expected 4 colon-separated parts.");
  }

  const [version, ivB64, authTagB64, ciphertextB64] = parts;

  if (version !== VERSION) {
    throw new Error(`Unsupported ciphertext version "${version}". This build understands "${VERSION}".`);
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

  try {
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Deliberately not including the original error — it can leak key/tag detail.
    throw new Error(
      "Could not decrypt credentials. Either CREDENTIALS_ENCRYPTION_KEY changed since this row was written, or the row was modified.",
    );
  }
}

/** Validates then encrypts a credential object for storage. */
export function encryptCredentials(data: CredentialData): string {
  const parsed = credentialDataSchema.parse(data);
  return encryptString(JSON.stringify(parsed));
}

/**
 * Decrypts a Credential row back into an object.
 * Only call this behind an authorization check — admin, or the buyer of an
 * order whose delivery has been approved.
 */
export function decryptCredentials(ciphertext: string): CredentialData {
  return credentialDataSchema.parse(JSON.parse(decryptString(ciphertext)));
}

/**
 * Safe-to-display summary of a credential without revealing it. Use in admin
 * lists and anywhere before delivery approval.
 * "player@example.com" -> "pl***@example.com"
 */
export function maskLogin(login: string): string {
  const at = login.indexOf("@");

  if (at <= 0) {
    return login.length <= 2 ? "***" : `${login.slice(0, 2)}***`;
  }

  const local = login.slice(0, at);
  const domain = login.slice(at);
  const head = local.slice(0, Math.min(2, local.length));

  return `${head}***${domain}`;
}

/** Generates a fresh 32-byte key as hex. Used by `npm run generate:key`. */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_BYTES).toString("hex");
}
