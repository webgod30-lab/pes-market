// Two-factor authentication. SERVER ONLY.
//
// Time-based one-time codes (RFC 6238) plus single-use recovery codes.
//
// Why this matters here more than on a normal site: the admin account approves
// every payout and can decrypt any account being traded. One password is the
// only thing standing in front of that.
//
// Note on the otplib API — this is version 13, which is not the version most
// examples on the internet are written against. There is no `authenticator`
// object; it is a functional API, verification is async, and the default time
// tolerance is zero rather than one step.
import { generate, generateSecret, generateURI, verify } from "otplib";

import { prisma } from "@/lib/prisma";
import { decryptString, encryptString } from "@/lib/crypto";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { SITE } from "@/lib/site";

export type TotpResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * How far out of step a phone's clock may be, in seconds.
 *
 * One 30-second step either way. Zero — the library default — rejects anyone
 * whose clock drifted by a few seconds, which is a lot of people and produces
 * a bug report that looks like "2FA is broken". Wider than this starts to
 * matter: every extra step is another code an attacker may guess.
 */
const CLOCK_TOLERANCE_SECONDS = 30;

/** How many recovery codes are issued at enrolment. */
const RECOVERY_CODE_COUNT = 10;

/** Unambiguous alphabet: no O/0, no I/1/l. These get read off a screen. */
const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Seconds per TOTP step. The RFC default, and what every authenticator uses. */
const TOTP_PERIOD_SECONDS = 30;

/**
 * Which step a successful verification matched, for replay protection.
 *
 * `verify()` is typed as returning the TOTP *or* the HOTP result, and only the
 * TOTP one carries an epoch — hence the optional property rather than a cast.
 * Deriving the step here also avoids `getTimeStepUsed`, which is exported from
 * the inner @otplib/totp package but not from otplib itself.
 *
 * Null means the step could not be established, and replay protection is
 * simply not armed for that sign-in rather than everyone being locked out.
 */
function timeStepFrom(result: { valid: true }): number | null {
  if (!("epoch" in result) || typeof result.epoch !== "number") return null;

  return Math.floor(result.epoch / TOTP_PERIOD_SECONDS);
}

function randomRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const chars = Array.from(bytes, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]);

  // Grouped for reading aloud and typing without losing your place.
  return `${chars.slice(0, 5).join("")}-${chars.slice(5, 10).join("")}`;
}

// ---------------------------------------------------------------------------
// Enrolment
// ---------------------------------------------------------------------------

/**
 * Starts enrolment: generates a secret, stores it encrypted, and returns what
 * the authenticator app needs.
 *
 * Deliberately does NOT switch two-factor on. Until confirmTotp() proves the
 * user can actually produce a code, turning it on would lock them out of their
 * own account — the single most common way this feature goes wrong.
 */
export async function beginTotpEnrolment(
  userId: string,
  email: string,
): Promise<TotpResult<{ secret: string; uri: string }>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabledAt: true },
  });

  if (!user) return { ok: false, error: "Account not found." };

  if (user.totpEnabledAt) {
    return { ok: false, error: "Two-factor is already on. Turn it off first to re-enrol." };
  }

  const secret = generateSecret();

  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: encryptString(secret), totpEnabledAt: null, totpLastStep: null },
  });

  return {
    ok: true,
    secret,
    uri: generateURI({ strategy: "totp", issuer: SITE.name, label: email, secret }),
  };
}

/**
 * Finishes enrolment once the user proves they can generate a code.
 *
 * Returns the recovery codes in the clear — the only time they are ever
 * readable. Only their hashes are stored.
 */
export async function confirmTotpEnrolment(
  userId: string,
  token: string,
): Promise<TotpResult<{ recoveryCodes: string[] }>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabledAt: true },
  });

  if (!user) return { ok: false, error: "Account not found." };
  if (user.totpEnabledAt) return { ok: false, error: "Two-factor is already on." };
  if (!user.totpSecret) return { ok: false, error: "Start the setup again — no secret is pending." };

  const secret = decryptString(user.totpSecret);
  const result = await verify({
    secret,
    token: token.replace(/\s/g, ""),
    epochTolerance: CLOCK_TOLERANCE_SECONDS,
  });

  if (!result.valid) {
    return { ok: false, error: "That code is not right. Check your app and try the current code." };
  }

  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, randomRecoveryCode);
  const hashes = await Promise.all(codes.map((c) => hashPassword(c)));

  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    prisma.recoveryCode.createMany({
      data: hashes.map((codeHash) => ({ userId, codeHash })),
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totpEnabledAt: new Date(), totpLastStep: timeStepFrom(result) },
    }),
  ]);

  return { ok: true, recoveryCodes: codes };
}

/**
 * Turns two-factor off. Requires the current password, because otherwise
 * anyone who found an unlocked laptop could strip the second factor off.
 */
export async function disableTotp(userId: string, password: string): Promise<TotpResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, role: true, totpEnabledAt: true },
  });

  if (!user) return { ok: false, error: "Account not found." };
  if (!user.totpEnabledAt) return { ok: false, error: "Two-factor is not on." };

  if (!(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "That password is not right." };
  }

  await prisma.$transaction([
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null },
    }),
  ]);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Checking a code at sign-in
// ---------------------------------------------------------------------------

export type SecondFactorOutcome =
  | { status: "not_required" }
  | { status: "accepted" }
  | { status: "missing" }
  /** Correct for this moment, but its step has already been spent. */
  | { status: "replayed" }
  | { status: "rejected" };

/**
 * Checks the second factor for an account that has already passed its password
 * check. Accepts either a current TOTP code or an unused recovery code.
 *
 * Called from authorize(), so it must never throw for an ordinary bad code —
 * a throw there becomes a generic sign-in failure with no explanation.
 */
export async function checkSecondFactor(
  userId: string,
  submitted: string | undefined,
): Promise<SecondFactorOutcome> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabledAt: true, totpLastStep: true },
  });

  if (!user?.totpEnabledAt || !user.totpSecret) return { status: "not_required" };

  const code = submitted?.replace(/\s/g, "") ?? "";

  if (!code) return { status: "missing" };

  // Recovery codes carry the separator and are longer than six digits, so the
  // two never collide.
  if (code.includes("-") || code.length > 8) {
    return (await spendRecoveryCode(userId, code)) ? { status: "accepted" } : { status: "rejected" };
  }

  const secret = decryptString(user.totpSecret);

  const result = await verify({
    secret,
    token: code,
    epochTolerance: CLOCK_TOLERANCE_SECONDS,
    // Refuses a code from a step already used, so one seen over a shoulder or
    // captured in a screenshot cannot be replayed while it is still in date.
    ...(user.totpLastStep === null ? {} : { afterTimeStep: user.totpLastStep }),
  });

  if (!result.valid) {
    // Distinguish "already used" from "wrong". Someone who just enrolled, or
    // who signed in seconds ago, is looking at a code their app still shows as
    // current — telling them it is incorrect sends them checking their clock
    // and their app when all they need to do is wait for the next one.
    if (user.totpLastStep !== null) {
      const withoutReplayGuard = await verify({
        secret,
        token: code,
        epochTolerance: CLOCK_TOLERANCE_SECONDS,
      });

      if (withoutReplayGuard.valid) return { status: "replayed" };
    }

    return { status: "rejected" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { totpLastStep: timeStepFrom(result) },
  });

  return { status: "accepted" };
}

/**
 * Marks a recovery code used, if it matches an unused one.
 *
 * Every unused hash has to be compared, because bcrypt hashes cannot be looked
 * up by value. Ten comparisons is fine; this only runs after a correct
 * password and is rate-limited on top.
 */
async function spendRecoveryCode(userId: string, code: string): Promise<boolean> {
  const candidates = await prisma.recoveryCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, codeHash: true },
  });

  const normalised = code.toUpperCase();

  for (const candidate of candidates) {
    if (!(await verifyPassword(normalised, candidate.codeHash))) continue;

    // Conditional on still being unused: two requests racing with the same
    // code cannot both spend it.
    const spent = await prisma.recoveryCode.updateMany({
      where: { id: candidate.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    return spent.count === 1;
  }

  return false;
}

/** How many recovery codes are left, for the security page. */
export function countUnusedRecoveryCodes(userId: string): Promise<number> {
  return prisma.recoveryCode.count({ where: { userId, usedAt: null } });
}

/** Whether an account has two-factor switched on. */
export async function totpIsEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabledAt: true },
  });

  return Boolean(user?.totpEnabledAt);
}

/** Exposed for the test scripts, which need a valid code without a phone. */
export function generateTotpForTesting(secret: string): Promise<string> {
  return generate({ secret });
}
