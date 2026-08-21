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
import {
  generateDealReference,
  generateInviteCode,
  generateReferralCode,
  normaliseReferralCode,
} from "../src/lib/ids";
import {
  MINIMUM_PAYOUT_CENTS,
  nextPayoutDate,
  REFERRAL_REWARD_CENTS,
} from "../src/lib/referrals";
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
      referralCode: "PES-7F3K9Q",
      role: "seller",
    }).email,
    "upper@example.com",
  );
  ok("registerSchema trims and lowercases the email");

  // Nobody gets in without a promoter's code, and the schema is where that
  // starts. A blank one has to fail here rather than reaching the database.
  assert.equal(
    registerSchema.safeParse({
      displayName: "Trader",
      email: "someone@example.com",
      password: "longenough",
      referralCode: "   ",
    }).success,
    false,
  );
  ok("registerSchema refuses a sign-up with no referral code");

  // Sign-up takes no role at all, so "admin" cannot be smuggled in through the
  // form — an extra key is simply ignored and the DB default ("user") applies.
  const smuggled = registerSchema.parse({
    displayName: "Trader",
    email: "someone@example.com",
    password: "longenough",
    referralCode: "PES-7F3K9Q",
    role: "admin",
  });
  assert.equal("role" in smuggled, false);
  ok("registerSchema strips any role sent by the client");

  // The code is supplied here so this fails on the password and nothing else —
  // otherwise the assertion would pass for the wrong reason.
  assert.equal(
    registerSchema.safeParse({
      displayName: "Trader",
      email: "someone@example.com",
      password: "short",
      referralCode: "PES-7F3K9Q",
    }).success,
    false,
  );
  ok("registerSchema refuses a short password");

  // --- referral codes -------------------------------------------------------
  //
  // What used to be here was the fee split. There is no fee: a swap has no
  // price to take a percentage of. The money that replaced it flows the other
  // way, and its entry point is the code somebody types at sign-up — so that
  // is what is asserted instead.
  assert.match(generateReferralCode(), /^PES-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  ok("referral codes use the unambiguous alphabet");

  assert.notEqual(generateReferralCode(), generateReferralCode());
  ok("two generated codes differ");

  // Every way a code arrives from a chat message has to find the promoter, or
  // a real sign-up is turned away over whitespace.
  for (const typed of ["PES-7F3K9Q", "pes-7f3k9q", "  PES-7F3K9Q  ", "7F3K9Q", "7f3k9q"]) {
    assert.equal(normaliseReferralCode(typed), "PES-7F3K9Q", `"${typed}" must normalise`);
  }
  ok("pasted codes normalise to one stored form, whatever the case or spacing");

  assert.equal(normaliseReferralCode(""), "");
  assert.equal(normaliseReferralCode("   "), "");
  ok("an empty code stays empty rather than becoming a bare prefix");

  assert.equal(REFERRAL_REWARD_CENTS, 200);
  assert.equal(MINIMUM_PAYOUT_CENTS, 4_000);
  ok("$2 a completed deal, $40 minimum payout — one rate, one threshold");

  // One threshold, every time. The pages say "twenty completed deals", and the
  // two constants have to keep saying that to each other.
  assert.equal(MINIMUM_PAYOUT_CENTS / REFERRAL_REWARD_CENTS, 20);
  ok("$40 is twenty completed deals, as the pages promise");


  // --- payout timing --------------------------------------------------------
  //
  // Requests are allowed on any day; the batch goes out on the 1st. Both edges
  // of a month are checked, since "the next 1st" is where an off-by-one lands.
  assert.equal(
    nextPayoutDate(new Date("2026-08-14T12:00:00Z")).toISOString(),
    "2026-09-01T00:00:00.000Z",
  );
  assert.equal(
    nextPayoutDate(new Date("2026-12-31T23:59:59Z")).toISOString(),
    "2027-01-01T00:00:00.000Z",
  );
  // On payout day itself the answer is the NEXT one, not today: today's batch
  // is already going out.
  assert.equal(
    nextPayoutDate(new Date("2026-08-01T00:00:00Z")).toISOString(),
    "2026-09-01T00:00:00.000Z",
  );
  ok("the next payout date is always the coming 1st, and rolls over the year");

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
