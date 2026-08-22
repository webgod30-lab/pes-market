// Drives the swap fixtures in swap-test-fixtures.json end to end, through the
// real domain layer — the same functions the server actions call.
//
//   npx tsx scripts/run-swap-fixtures.ts --file <path>            run every swap
//   npx tsx scripts/run-swap-fixtures.ts --file <path> --only 1   just TEST-SWAP-01
//   npx tsx scripts/run-swap-fixtures.ts --file <path> --dry-run  resolve users, change nothing
//   npx tsx scripts/run-swap-fixtures.ts --file <path> --create-missing-users
//
// Deliberately does NOT write reviews. A review is a public claim about a trade
// that happened; these trades did not. Everything else in the lifecycle is
// exercised.
//
// Unlike run-deal-bot.ts this has no local-only guard, because it is meant to be
// pointed at a chosen database. It prints the host it is about to write to and
// requires --i-know-this-is-remote for anything that is not localhost.
import "dotenv/config";

import { readFileSync, writeFileSync } from "node:fs";

import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/passwords";
import {
  approveDelivery,
  confirmClaimed,
  createDeal,
  depositCredentials,
  joinDealByCode,
  recordVerification,
  revealDeliveredCredentials,
} from "../src/lib/deals";
import { mintReferralCode } from "../src/lib/referrals";
import { leaveReview } from "../src/lib/reviews";
import type { CurrentUser } from "../src/lib/dal";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);

function flag(name: string): boolean {
  return argv.includes(`--${name}`);
}

function option(name: string): string | null {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : (argv[i + 1] ?? null);
}

const FIXTURE_PATH = option("file");
const ONLY = option("only");
const DRY_RUN = flag("dry-run");
const CREATE_MISSING = flag("create-missing-users");
const ACK_REMOTE = flag("i-know-this-is-remote");
const WITH_REVIEWS = flag("with-reviews");
const LOG_PATH = option("log") ?? "swap-fixture-run.json";

if (!FIXTURE_PATH) {
  throw new Error("Pass --file <path to swap-test-fixtures.json>.");
}

// ---------------------------------------------------------------------------
// Target database — stated out loud, never inferred silently
// ---------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL is not set.");

const host = new URL(connectionString).hostname;
const isLocal =
  host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local");

console.log(`\n  target database : ${host}  ${isLocal ? "(local)" : "*** REMOTE ***"}`);
console.log(`  fixtures        : ${FIXTURE_PATH}`);
console.log(`  mode            : ${DRY_RUN ? "DRY RUN — no writes" : "WRITING"}`);
console.log(`  reviews         : ${WITH_REVIEWS ? "YES — local databases only" : "not written"}\n`);

// Reviews are the one thing that cannot be undone by deleting a row later: they
// are a public claim, made in a named person's voice, that a trade happened and
// went well. On a development database that is fixture data for looking at the
// page. On a live one it is fabricated social proof on a service that holds
// other people's game accounts — which is what the FTC's fake-review rule, the
// UK's DMCC Act and the EU's UCPD each prohibit, and which would make the
// promise printed on /reviews ("every review, from both sides of a completed
// deal") untrue.
//
// Deliberately NOT covered by --i-know-this-is-remote. That flag exists so a
// deliberate remote run of the deal flow is possible; this one is not something
// an acknowledgement should be able to unlock.
if (WITH_REVIEWS && !isLocal) {
  throw new Error(
    [
      `Refusing to write reviews to "${host}".`,
      "",
      "--with-reviews is for development databases only, and no flag overrides",
      "that. Run the swaps without it, and let the real parties review them.",
    ].join("\n"),
  );
}

if (!isLocal && !DRY_RUN && !ACK_REMOTE) {
  throw new Error(
    [
      `Refusing to write to "${host}" without --i-know-this-is-remote.`,
      "",
      "Completed swaps move the public counters on the homepage and the",
      "/reviews page, and each one writes $2 promoter credits. There is no",
      "is_test flag in this schema, so they cannot be filtered out afterwards —",
      "only deleted. Re-run with --i-know-this-is-remote if that is intended.",
    ].join("\n"),
  );
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type Fixture = {
  swap_ref: string;
  side_a_site_email: string;
  side_b_site_email: string;
  game: string;
  platform: string;
  level: string;
  a_account_description: string;
  a_expects_in_exchange: string;
  a_game_login_email: string;
  a_game_login_password: string;
  b_game_login_email: string;
  b_game_login_password: string;
};

const parsed = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as { swaps: Fixture[] };
const all = parsed.swaps;

const swaps = ONLY
  ? all.filter((s) => s.swap_ref.endsWith(String(ONLY).padStart(2, "0")))
  : all;

if (swaps.length === 0) throw new Error(`No fixtures matched --only ${ONLY}.`);

const USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  createdAt: true,
} as const;

async function findUser(email: string): Promise<CurrentUser | null> {
  return prisma.user.findUnique({ where: { email }, select: USER_SELECT });
}

/** Only used for local validation runs. */
async function createUser(email: string): Promise<CurrentUser> {
  const displayName = email.split("@")[0]!.replace(/[0-9]+/g, "") || "tester";
  const password = `T${Math.random().toString(36).slice(2)}A9!x`;

  return prisma.user.create({
    data: {
      email,
      displayName,
      passwordHash: await hashPassword(password),
      role: "user",
      referralCode: await mintReferralCode(),
    },
    select: USER_SELECT,
  });
}

async function findAdmin(): Promise<CurrentUser> {
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: USER_SELECT,
    orderBy: { createdAt: "asc" },
  });

  if (!admin) throw new Error("No admin account exists — nothing can be verified or released.");

  return admin;
}

// ---------------------------------------------------------------------------
// One swap, all the way through
// ---------------------------------------------------------------------------

type StepLog = { step: string; ok: boolean; detail?: string };

type Result = {
  swap_ref: string;
  dealId: string | null;
  reference: string | null;
  inviteCode: string | null;
  finalStatus: string | null;
  ok: boolean;
  steps: StepLog[];
};

function credentialsFor(login: string, password: string, swapRef: string) {
  return {
    loginEmail: login,
    loginPassword: password,
    recoveryEmail: "",
    recoveryEmailPassword: "",
    notes: `TEST FIXTURE - NOT A REAL LISTING. Placeholder credentials for ${swapRef}.`,
  };
}

async function runSwap(fixture: Fixture, admin: CurrentUser): Promise<Result> {
  const steps: StepLog[] = [];
  const result: Result = {
    swap_ref: fixture.swap_ref,
    dealId: null,
    reference: null,
    inviteCode: null,
    finalStatus: null,
    ok: false,
    steps,
  };

  function record(step: string, outcome: { ok: boolean; error?: string }): boolean {
    steps.push({ step, ok: outcome.ok, detail: outcome.ok ? undefined : outcome.error });
    return outcome.ok;
  }

  // --- the two parties -----------------------------------------------------
  let a = await findUser(fixture.side_a_site_email);
  let b = await findUser(fixture.side_b_site_email);

  if (!a || !b) {
    const missing = [!a && fixture.side_a_site_email, !b && fixture.side_b_site_email]
      .filter(Boolean)
      .join(", ");

    if (!CREATE_MISSING) {
      steps.push({ step: "resolve users", ok: false, detail: `not registered: ${missing}` });
      return result;
    }

    if (!a) a = await createUser(fixture.side_a_site_email);
    if (!b) b = await createUser(fixture.side_b_site_email);
    steps.push({ step: "create missing users", ok: true, detail: missing });
  }

  steps.push({ step: "resolve users", ok: true, detail: `${a.email} <-> ${b.email}` });

  if (a.role === "promoter" || b.role === "promoter") {
    steps.push({ step: "check roles", ok: false, detail: "a promoter account cannot trade" });
    return result;
  }

  if (DRY_RUN) {
    result.ok = true;
    steps.push({ step: "dry run", ok: true, detail: "stopped before any write" });
    return result;
  }

  // --- 1. A opens the swap -------------------------------------------------
  const level = Number(fixture.level);

  const created = await createDeal({
    creator: a,
    side: "seller",
    accountSummary: fixture.a_account_description,
    counterAccountSummary: fixture.a_expects_in_exchange,
    game: fixture.game,
    platform: fixture.platform || null,
    level: Number.isFinite(level) ? level : null,
  });

  if (!record("create deal", created)) return result;
  if (!created.ok) return result;

  result.dealId = created.dealId;
  result.reference = created.reference;
  result.inviteCode = created.inviteCode;

  // --- 2. B joins with the invite code -------------------------------------
  if (!record("join with code", await joinDealByCode(b, created.inviteCode))) return result;

  // --- 3. both sides deposit their account ---------------------------------
  const depositA = await depositCredentials(
    a,
    created.dealId,
    credentialsFor(fixture.a_game_login_email, fixture.a_game_login_password, fixture.swap_ref),
  );

  if (!record("deposit A account", depositA)) return result;

  const depositB = await depositCredentials(
    b,
    created.dealId,
    credentialsFor(fixture.b_game_login_email, fixture.b_game_login_password, fixture.swap_ref),
  );

  if (!record("deposit B account", depositB)) return result;

  // --- 4. admin records what was checked, on both sides --------------------
  //
  // The note says plainly that nothing was signed into. The credentials are
  // .invalid placeholders, so no verification was possible or performed.
  const note =
    "TEST FIXTURE - NOT A REAL LISTING. No account was signed into. " +
    "Placeholder credentials on a reserved .invalid domain; recorded for test purposes only.";

  if (!record("verify A side", await recordVerification(admin, created.dealId, note, "seller"))) {
    return result;
  }

  if (!record("verify B side", await recordVerification(admin, created.dealId, note, "buyer"))) {
    return result;
  }

  // --- 5. admin releases both accounts -------------------------------------
  if (!record("approve delivery", await approveDelivery(admin, created.dealId))) return result;

  // --- 6. each side reads what the other put up ----------------------------
  record("A reads B's account", await revealDeliveredCredentials(a, created.dealId));
  record("B reads A's account", await revealDeliveredCredentials(b, created.dealId));

  // --- 7. both confirm; the second one closes the swap ---------------------
  if (!record("A confirms", await confirmClaimed(a, created.dealId))) return result;
  if (!record("B confirms", await confirmClaimed(b, created.dealId))) return result;

  const final = await prisma.deal.findUnique({
    where: { id: created.dealId },
    select: { status: true },
  });

  result.finalStatus = final?.status ?? null;
  result.ok = final?.status === "completed";

  // --- 8. both sides review, if this is a development database -------------
  if (WITH_REVIEWS && result.ok) {
    const comment =
      "TEST FIXTURE - NOT A REAL REVIEW. Generated to populate a development " +
      "database so the reviews page can be looked at with data in it.";

    record("A reviews B", await leaveReview(a, created.dealId, 5, comment));
    record("B reviews A", await leaveReview(b, created.dealId, 5, comment));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const admin = DRY_RUN ? ({ id: "", email: "", displayName: "", role: "admin", createdAt: new Date() } as CurrentUser) : await findAdmin();

  if (!DRY_RUN) console.log(`  admin           : ${admin.email}\n`);

  const results: Result[] = [];

  for (const fixture of swaps) {
    process.stdout.write(`  ${fixture.swap_ref} … `);

    let result: Result;

    try {
      result = await runSwap(fixture, admin);
    } catch (error) {
      result = {
        swap_ref: fixture.swap_ref,
        dealId: null,
        reference: null,
        inviteCode: null,
        finalStatus: null,
        ok: false,
        steps: [{ step: "threw", ok: false, detail: String(error) }],
      };
    }

    results.push(result);

    if (result.ok) {
      console.log(`${result.finalStatus ?? "dry-run ok"}  ${result.reference ?? ""}`);
    } else {
      const failed = result.steps.find((s) => !s.ok);
      console.log(`FAILED at "${failed?.step}" — ${failed?.detail ?? "unknown"}`);
    }
  }

  const done = results.filter((r) => r.ok).length;

  console.log(`\n  ${done}/${results.length} reached completion.\n`);

  writeFileSync(
    LOG_PATH,
    JSON.stringify(
      { target: host, ranAt: new Date().toISOString(), dryRun: DRY_RUN, results },
      null,
      2,
    ),
  );

  console.log(`  log written to ${LOG_PATH}\n`);

  if (done !== results.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
