// Smoke test for the database-free logic: credential encryption, password
// hashing, money parsing and input validation. Needs no database.
//
// Run with:  npm run test:smoke
import "dotenv/config";
import assert from "node:assert/strict";

import {
  encryptCredentials,
  decryptCredentials,
  encryptString,
  decryptString,
  maskLogin,
} from "../src/lib/crypto";
import { hashPassword, verifyPassword } from "../src/lib/passwords";
import { formatCents, parsePriceToCents } from "../src/lib/money";
import { registerSchema } from "../src/lib/validation";
import { splitDealMoney, formatFeeBps } from "../src/lib/fees";
import { generateDealReference, generateInviteCode } from "../src/lib/ids";
import { databaseProblemMessage, describeDatabaseProblemDeep } from "../src/lib/db-errors";

let passed = 0;
function ok(label: string) {
  passed++;
  console.log(`  PASS  ${label}`);
}

async function main() {
  // --- credential encryption ------------------------------------------------
  const creds = {
    loginEmail: "player@example.com",
    loginPassword: "s3cret-pw",
    recoveryEmail: "recovery@example.com",
    recoveryEmailPassword: "inbox-pw",
    notes: "2FA off. Bound to Android.",
  };

  const blob = encryptCredentials(creds);
  assert.match(blob, /^v1:[^:]+:[^:]+:[^:]+$/);
  ok("encrypted payload has the versioned 4-part shape");

  assert.ok(!blob.includes("s3cret-pw"), "plaintext password must not appear");
  assert.ok(!blob.includes("player@example.com"), "plaintext email must not appear");
  ok("ciphertext contains no plaintext fragments");

  assert.deepEqual(decryptCredentials(blob), creds);
  ok("round-trips back to the original object");

  assert.notEqual(encryptCredentials(creds), encryptCredentials(creds));
  ok("same plaintext encrypts differently each time (random IV)");

  // Tampering must be detected, not silently accepted.
  const [v, iv, tag, data] = blob.split(":");
  const flipped = Buffer.from(data, "base64");
  flipped[0] ^= 0xff;
  assert.throws(
    () => decryptString([v, iv, tag, flipped.toString("base64")].join(":")),
    /Could not decrypt/,
  );
  ok("detects tampering with the ciphertext");

  assert.throws(() => decryptString("v1:only:three"), /Malformed/);
  ok("rejects a malformed payload");

  assert.throws(() => decryptString(`v9:${iv}:${tag}:${data}`), /Unsupported ciphertext version/);
  ok("rejects an unknown version prefix");

  const unicode = `Ronaldinho ⚽ пароль 密码 ${"x".repeat(200)}`;
  assert.equal(decryptString(encryptString(unicode)), unicode);
  ok("handles unicode and long strings");

  // --- masking --------------------------------------------------------------
  assert.equal(maskLogin("player@example.com"), "pl***@example.com");
  assert.equal(maskLogin("ab"), "***");
  assert.equal(maskLogin("username123"), "us***");
  ok("maskLogin hides the local part");

  // --- money ----------------------------------------------------------------
  assert.equal(parsePriceToCents("19.99"), 1999);
  assert.equal(parsePriceToCents("19,99"), 1999);
  assert.equal(parsePriceToCents("185"), 18500);
  assert.equal(parsePriceToCents("0"), null);
  assert.equal(parsePriceToCents("-5"), null);
  assert.equal(parsePriceToCents("abc"), null);
  assert.equal(parsePriceToCents("1.999"), null);
  ok("parsePriceToCents accepts sane prices and rejects junk");

  assert.equal(formatCents(1999), "$19.99");
  assert.equal(formatCents(18500), "$185.00");
  ok("formatCents renders currency");

  // --- validation -----------------------------------------------------------
  assert.equal(
    registerSchema.parse({
      displayName: "  Trader  ",
      email: "  UPPER@Example.COM ",
      password: "longenough",
      role: "seller",
    }).email,
    "upper@example.com",
  );
  ok("registerSchema trims and lowercases the email");

  // Sign-up takes no role at all, so "admin" cannot be smuggled in through the
  // form — an extra key is simply ignored and the DB default ("user") applies.
  const smuggled = registerSchema.parse({
    displayName: "Trader",
    email: "someone@example.com",
    password: "longenough",
    role: "admin",
  });
  assert.equal("role" in smuggled, false);
  ok("registerSchema strips any role sent by the client");

  assert.equal(
    registerSchema.safeParse({
      displayName: "Trader",
      email: "someone@example.com",
      password: "short",
    }).success,
    false,
  );
  ok("registerSchema refuses a short password");

  // --- fee split ------------------------------------------------------------
  const split = splitDealMoney(18_500, 500);
  assert.equal(split.feeCents, 925);
  assert.equal(split.sellerPayoutCents, 17_575);
  // The money must always add up exactly — no cent lost to rounding.
  assert.equal(split.feeCents + split.sellerPayoutCents, split.agreedPriceCents);
  ok("splitDealMoney takes 5% and the parts add back to the price");

  const zero = splitDealMoney(4_200, 0);
  assert.equal(zero.feeCents, 0);
  assert.equal(zero.sellerPayoutCents, 4_200);
  ok("splitDealMoney with a 0 bp fee pays the seller in full");

  // Odd amounts are where a naive implementation loses a cent.
  for (const price of [1, 3, 7, 99, 333, 1_667, 99_999]) {
    const s = splitDealMoney(price, 500);
    assert.equal(s.feeCents + s.sellerPayoutCents, price, `price ${price} must reconcile`);
  }
  ok("splitDealMoney reconciles for awkward amounts");

  assert.throws(() => splitDealMoney(0, 500), /positive whole number/);
  assert.throws(() => splitDealMoney(1_000, 10_001), /between 0 and 10000/);
  assert.throws(() => splitDealMoney(19.99, 500), /positive whole number/);
  ok("splitDealMoney rejects bad input instead of guessing");

  assert.equal(formatFeeBps(500), "5%");
  assert.equal(formatFeeBps(250), "2.5%");
  assert.equal(formatFeeBps(0), "0%");
  ok("formatFeeBps renders the rate");

  // --- references and invite codes ------------------------------------------
  assert.match(generateDealReference(), /^ESC-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  ok("deal references use the unambiguous alphabet");

  const references = new Set(Array.from({ length: 500 }, () => generateDealReference()));
  assert.ok(references.size > 495, "references should almost never collide in 500 draws");
  ok("deal references are spread out");

  const codes = new Set(Array.from({ length: 200 }, () => generateInviteCode()));
  assert.equal(codes.size, 200);
  assert.ok(generateInviteCode().length >= 32);
  assert.doesNotMatch(generateInviteCode(), /[^A-Za-z0-9_-]/);
  ok("invite codes are unique, long and url-safe");

  // --- database setup errors -------------------------------------------------
  // These are the failures a first-time setup actually hits. Each must produce
  // an actionable message rather than a blank crash.
  const refused = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5432"), {
    code: "ECONNREFUSED",
  });
  assert.match(databaseProblemMessage(refused) ?? "", /not reachable/i);
  assert.match(databaseProblemMessage(refused) ?? "", /db:dev|DATABASE_URL/);
  ok("an unreachable database explains itself");

  const noTables = Object.assign(new Error('relation "User" does not exist'), { code: "42P01" });
  assert.match(databaseProblemMessage(noTables) ?? "", /no tables yet/i);
  assert.match(databaseProblemMessage(noTables) ?? "", /db:migrate/);
  ok("missing tables point at db:migrate");

  assert.match(
    databaseProblemMessage(Object.assign(new Error("nope"), { code: "P1001" })) ?? "",
    /not reachable/i,
  );
  assert.match(
    databaseProblemMessage(Object.assign(new Error("nope"), { code: "28P01" })) ?? "",
    /rejected the username or password/i,
  );
  ok("Prisma and pg error codes are both recognised");

  // The reason the login form used to blame the user for an outage: NextAuth
  // buries the real error at `cause.err` inside its own AuthError.
  const wrapped = Object.assign(new Error("Read more at https://errors.authjs.dev"), {
    cause: { err: refused },
  });
  assert.match(databaseProblemMessage(wrapped) ?? "", /not reachable/i);
  ok("a database error wrapped by NextAuth is still detected");

  // Doubly wrapped, as Prisma-inside-NextAuth actually arrives.
  const doubleWrapped = new Error("outer", { cause: wrapped });
  assert.match(databaseProblemMessage(doubleWrapped) ?? "", /not reachable/i);
  ok("nested error causes are walked");

  // Hosted databases that sleep when idle hand back a dead pooled socket on the
  // first request after waking. That must read as "retry", not "broken setup".
  assert.match(
    databaseProblemMessage(new Error("Connection terminated unexpectedly")) ?? "",
    /Lost the connection/i,
  );
  assert.match(
    databaseProblemMessage(new Error("Connection terminated unexpectedly")) ?? "",
    /reload/i,
  );
  assert.match(
    databaseProblemMessage(Object.assign(new Error("socket hang up"), { code: "ECONNRESET" })) ?? "",
    /Lost the connection/i,
  );
  ok("a dropped connection tells you to retry, not to fix your setup");

  // A genuine wrong-password must NOT be mistaken for a database problem,
  // otherwise real failed logins would show a misleading setup message.
  assert.equal(describeDatabaseProblemDeep(new Error("CredentialsSignin")), null);
  assert.equal(describeDatabaseProblemDeep(null), null);
  assert.equal(describeDatabaseProblemDeep(undefined), null);
  assert.equal(describeDatabaseProblemDeep("just a string"), null);
  ok("ordinary errors are not misreported as database problems");

  // Must not hang or overflow on a cycle.
  const cyclic: { cause?: unknown } = new Error("loop");
  cyclic.cause = cyclic;
  assert.equal(describeDatabaseProblemDeep(cyclic), null);
  ok("a self-referencing error cause terminates");

  // --- passwords ------------------------------------------------------------
  const hash = await hashPassword("correct-horse");
  assert.ok(hash.startsWith("$2"));
  assert.notEqual(hash, "correct-horse");
  assert.equal(await verifyPassword("correct-horse", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  ok("bcrypt hashes and verifies");

  console.log(`\n${passed} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
