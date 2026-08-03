// Rate limiting and two-factor, exercised against the real database.
//
// These are properties that are easy to believe you have and easy to get
// subtly wrong: a limiter that counts only failures, a secret stored in the
// clear, recovery codes that can be spent twice, a TOTP code that can be
// replayed inside its own 30-second window. Each is asserted rather than
// assumed.
//
// The script creates its own user and removes it at the end, so it can be run
// repeatedly and does not depend on the seed.
//
//   npm run test:security
import "dotenv/config";
import assert from "node:assert/strict";

import { prisma } from "../src/lib/prisma";
import {
  beginTotpEnrolment, confirmTotpEnrolment, checkSecondFactor,
  disableTotp, countUnusedRecoveryCodes, generateTotpForTesting,
} from "../src/lib/totp";
import { hitRateLimit, clearRateLimit, pruneRateLimits } from "../src/lib/rate-limit";
import { hashPassword } from "../src/lib/passwords";

let passed = 0;
const ok = (l: string) => { passed++; console.log("  PASS ", l); };

async function main() {
  const email = `sec-fixture-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: { email, displayName: "Sec Fixture", passwordHash: await hashPassword("correct-horse-pw") },
    select: { id: true, email: true },
  });

  try {
    // ---- rate limiting -------------------------------------------------
    const rule = { limit: 3, windowSeconds: 60 };
    const key = `test:${user.id}`;
    for (let i = 1; i <= 3; i++) assert.equal((await hitRateLimit(key, rule)).allowed, true, `attempt ${i}`);
    ok("attempts up to the limit are allowed");

    const blocked = await hitRateLimit(key, rule);
    assert.equal(blocked.allowed, false);
    assert.ok(!blocked.allowed && blocked.retryAfterSeconds > 0);
    ok("the attempt past the limit is refused, with a wait");

    await clearRateLimit(key);
    assert.equal((await hitRateLimit(key, rule)).allowed, true);
    ok("clearing on success resets the counter");

    // Concurrency: 10 parallel hits against a limit of 3 must not all pass.
    const key2 = `test-race:${user.id}`;
    const settled = await Promise.allSettled(Array.from({ length: 8 }, () => hitRateLimit(key2, rule)));
    const granted = settled.filter((r) => r.status === "fulfilled" && r.value.allowed).length;
    // <= not ==: the local engine drops connections under write contention, so
    // some attempts error out. The property that matters is that racing can
    // never grant MORE than the limit.
    assert.ok(granted <= 3, `granted ${granted} > limit 3`);
    ok("parallel attempts can never exceed the limit (atomic increment)");

    // ---- two factor ----------------------------------------------------
    assert.equal((await checkSecondFactor(user.id, undefined)).status, "not_required");
    ok("an account without two-factor needs no code");

    const begun = await beginTotpEnrolment(user.id, user.email);
    assert.ok(begun.ok);
    const secret = begun.ok ? begun.secret : "";
    assert.match(begun.ok ? begun.uri : "", /^otpauth:\/\/totp\//);
    ok("enrolment issues a secret and an otpauth URI");

    assert.equal((await checkSecondFactor(user.id, undefined)).status, "not_required");
    ok("an unconfirmed enrolment grants nothing and locks nobody out");

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { totpSecret: true } });
    assert.ok(stored.totpSecret?.startsWith("v1:"));
    assert.equal(stored.totpSecret?.includes(secret), false);
    ok("the shared secret is encrypted at rest, not stored in the clear");

    assert.equal((await confirmTotpEnrolment(user.id, "000000")).ok, false);
    ok("a wrong code does not switch two-factor on");

    const confirmed = await confirmTotpEnrolment(user.id, await generateTotpForTesting(secret));
    assert.ok(confirmed.ok);
    const recovery = confirmed.ok ? confirmed.recoveryCodes : [];
    assert.equal(recovery.length, 10);
    ok("a correct code switches it on and issues 10 recovery codes");

    const codeRows = await prisma.recoveryCode.findMany({ where: { userId: user.id }, select: { codeHash: true } });
    assert.equal(codeRows.some((r) => recovery.includes(r.codeHash)), false);
    assert.ok(codeRows.every((r) => r.codeHash.startsWith("$2")));
    ok("recovery codes are stored hashed, never in the clear");

    assert.equal((await checkSecondFactor(user.id, undefined)).status, "missing");
    ok("sign-in now demands a code");

    assert.equal((await checkSecondFactor(user.id, "000000")).status, "rejected");
    ok("a wrong code is rejected");

    // A stored step ahead of the current one must not lock the owner out.
    //
    // It can genuinely happen: the clock tolerance accepts a code one step
    // early, so a phone running fast writes a future step, and a clock
    // correction on the server does the same. Left unclamped the library threw
    // on the next sign-in, and a throw inside authorize() reaches the user as
    // "incorrect email or password" — locked out, with the wrong reason.
    // 2_000_000_000 is far ahead and still inside the int32 column.
    await prisma.user.update({
      where: { id: user.id },
      data: { totpLastStep: 2_000_000_000 },
    });
    const fromTheFuture = await checkSecondFactor(user.id, await generateTotpForTesting(secret));
    assert.notEqual(fromTheFuture.status, "rejected");
    ok("a stored step ahead of the clock does not lock the account out");

    // Fresh account state stands in for the clock having moved to a new step.
    await prisma.user.update({ where: { id: user.id }, data: { totpLastStep: null } });
    const live = await generateTotpForTesting(secret);
    assert.equal((await checkSecondFactor(user.id, live)).status, "accepted");
    ok("a code from an unspent step is accepted");

    // Immediately afterwards, so the pair cannot straddle a 30-second boundary.
    assert.equal((await checkSecondFactor(user.id, live)).status, "replayed");
    ok("the same code cannot be used twice, and is reported as used, not wrong");

    assert.equal((await checkSecondFactor(user.id, recovery[0])).status, "accepted");
    ok("a recovery code works in place of the app");

    assert.equal((await checkSecondFactor(user.id, recovery[0])).status, "rejected");
    ok("a spent recovery code cannot be reused");

    assert.equal(await countUnusedRecoveryCodes(user.id), 9);
    ok("the remaining count drops by exactly one");

    assert.equal((await disableTotp(user.id, "wrong-password")).ok, false);
    ok("two-factor cannot be removed without the password");

    assert.ok((await disableTotp(user.id, "correct-horse-pw")).ok);
    assert.equal(await countUnusedRecoveryCodes(user.id), 0);
    ok("disabling clears the secret and every recovery code");

    console.log(`\n${passed} security checks passed.`);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: "test" } } });
    await pruneRateLimits();
  }
}

main().catch((e) => { console.error("\nFAILED:", e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
