// End-to-end deal bot: registers traders and walks them through whole deals.
//
//   npm run bot:deals           12 deals (default)
//   npm run bot:deals 40        more
//   BOT_SEED=7 npm run bot:deals    reproduce an exact run
//   KEEP_BOT_DATA=1 npm run bot:deals   leave the data behind to look at
//
// What this is for. The other scripts each cover one slice: db:seed writes
// finished rows straight into the database, test:guards drives the domain layer
// with users that already exist, test:load measures query time at scale. None of
// them start where a real person starts. This one registers a brand new pair of
// traders for every swap and plays the whole thing out — register with a
// promoter's code, create, invite, join, both deposits, verify, release, the
// Konami code exchange, both confirmations and both reviews — checking the
// result of every step.
//
// So it answers a question the others cannot: can two people who signed up a
// minute ago actually complete a trade, using only the routes the UI offers?
//
// Every deal it creates is an account-for-account swap, because that is the
// only kind the site offers. Nothing pays and nothing is paid out; the money
// that moves is the $2 each completed swap owes the two traders' promoters.
//
// LOCAL ONLY. See the guard below.
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/passwords";
import { mintReferralCode } from "../src/lib/referrals";
import { registerSchema, createDealSchema } from "../src/lib/validation";
// No payment functions here any more: a swap has nothing to pay, so
// submitPayment, confirmPaymentReceived and markPayoutSent are unreachable
// from a deal this bot can create. They still exist for the archived cash
// deals — see scripts/check-deal-guards.ts, which still exercises them.
import {
  approveDelivery,
  confirmClaimed,
  createDeal,
  depositCredentials,
  joinDealByCode,
  revealDeliveredCredentials,
} from "../src/lib/deals";
import { postMessage } from "../src/lib/messages";
import { leaveReview } from "../src/lib/reviews";
import { openDispute } from "../src/lib/disputes";
import { requestTransferCode, sendTransferCode } from "../src/lib/transfer-codes";
import { ACCOUNTS, SELLER_REVIEWS, BUYER_REVIEWS } from "./bot-content";
import type { CurrentUser } from "../src/lib/dal";

// ---------------------------------------------------------------------------
// Production guard
// ---------------------------------------------------------------------------
//
// The same rule as prisma/seed.ts, and for the same reason. This script invents
// people and writes REVIEWS in their names. On a local database that is test
// data. On a live site it is fabricated social proof on a service that holds
// other people's money — illegal under the FTC's fake-review rule in the US, the
// DMCC Act in the UK and the Unfair Commercial Practices Directive in the EU,
// and it would make the promise on /reviews ("every review comes from a deal
// that actually completed") a lie.
//
// This script is worse than the seed in one way: those users can sign in. Do not
// remove this. Override only for a throwaway staging database.
function assertSafeToRun(url: string): void {
  if (process.env.ALLOW_REMOTE_SEED === "1") {
    console.warn("⚠ ALLOW_REMOTE_SEED=1 — running against a non-local database on purpose.\n");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run with NODE_ENV=production. This script registers users and writes reviews in their names.",
    );
  }

  let host: string;

  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local");

  if (!isLocal) {
    throw new Error(
      [
        `Refusing to run against "${host}" — it does not look local.`,
        "",
        "This registers accounts that can sign in, completes deals in their names",
        "and posts reviews from them. That is test data on a local database and",
        "fake social proof anywhere else.",
        "",
        "If this really is a throwaway staging database, re-run with ALLOW_REMOTE_SEED=1.",
      ].join("\n"),
    );
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");

assertSafeToRun(connectionString);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** `npm run bot:clean` — remove a previous run's data and do nothing else. */
const CLEAN_ONLY = process.argv[2] === "clean" || process.argv.includes("--clean");

const TOTAL = CLEAN_ONLY ? 0 : Number(process.argv[2] ?? 12);

if (!CLEAN_ONLY && (!Number.isInteger(TOTAL) || TOTAL < 1)) {
  throw new Error(`Deal count must be a positive whole number, got "${process.argv[2]}".`);
}

/**
 * Every address the bot creates lives on this domain. `.invalid` is reserved by
 * RFC 2606 and can never resolve, so no message can reach a real inbox even by
 * accident — and it gives cleanup an exact key to delete on.
 */
const BOT_EMAIL_DOMAIN = "deal-bot.invalid";

/** Shared by every bot account. Local fixtures, never anything real. */
const BOT_PASSWORD = "BotTrader123!pes";

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------
//
// Seeded so a failing run can be reproduced exactly with BOT_SEED=<n>.

const SEED = Number(process.env.BOT_SEED ?? 1);

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(SEED);

const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const between = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));

/**
 * Fisher-Yates, seeded.
 *
 * The content pools arrive grouped — every account description sorted by
 * platform, every review sorted by rating with the five-star ones first. Walking
 * them in order meant a short run drew nothing but mobile accounts and nothing
 * but five-star reviews, which is the one thing the reviews reference says makes
 * a record worthless. Shuffling spreads the whole range across any run length.
 */
function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

const accountPool = shuffled(ACCOUNTS);
const sellerReviewPool = shuffled(SELLER_REVIEWS);
const buyerReviewPool = shuffled(BUYER_REVIEWS);

/** The names that turn up in the account descriptions the pool is built from. */
const EPIC_NAMES = [
  "Zidane",
  "Henry",
  "Nedvěd",
  "Cannavaro",
  "Vieira",
  "Ronaldinho",
  "R9 Ronaldo",
  "Batistuta",
  "Van Basten",
  "Beckenbauer",
  "Cruyff",
  "Zico",
];

/**
 * A count of Epics and a matching list of names, as form strings.
 *
 * Derived from the index rather than parsed out of the description: the pool's
 * summaries mention Epics in prose, and a bot that guessed at parsing them
 * would put its own bugs into the fixture data. What matters here is that the
 * two fields agree with each other, which they do by construction.
 */
function epicsFor(index: number, prefix: "" | "counter" = ""): Record<string, string> {
  const count = between(2, 6);
  const names = Array.from(
    { length: count },
    (_, i) => EPIC_NAMES[(index * 3 + i) % EPIC_NAMES.length],
  );

  return prefix === ""
    ? { epics: String(count), epicPlayers: names.join(", ") }
    : { counterEpics: String(count), counterEpicPlayers: names.join(", ") };
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------
//
// Transliterated rather than in Arabic script, to match how every display name
// already on the site is written. These combine into far more names than any run
// needs, and a numeric suffix on the address keeps collisions impossible.

const GIVEN_NAMES = [
  "Mohammed", "Ahmed", "Youssef", "Karim", "Omar", "Bilal", "Hamza", "Yassine",
  "Anas", "Mehdi", "Rayan", "Ilyas", "Sofiane", "Nadir", "Walid", "Zakaria",
  "Oussama", "Tarek", "Younes", "Adam", "Khalil", "Marwan", "Ayoub", "Reda",
  "Nassim", "Idriss", "Salim", "Jibril", "Farouk", "Taha", "Amir", "Bassem",
  "Hicham", "Sami", "Ismail", "Nabil", "Rachid", "Jamal", "Fouad", "Aziz",
  "Mounir", "Othmane", "Yahya", "Amine", "Badr", "Elias", "Hakim", "Imad",
  "Kamal", "Lotfi", "Majid", "Riad", "Samir", "Wassim", "Yacine", "Zouhair",
  "Amina", "Fatima", "Leila", "Nour", "Sara", "Yasmine", "Rania", "Salma",
  "Hiba", "Meriem", "Khadija", "Zineb", "Imane", "Asma", "Malak", "Lina",
];

const FAMILY_NAMES = [
  "Benali", "El Amrani", "Haddad", "Cherkaoui", "Bouazza", "Naciri", "Tazi",
  "Berrada", "Alaoui", "Idrissi", "Bennani", "Sekkat", "Lahlou", "Kettani",
  "Belkacem", "Boukhari", "Mansouri", "Ziani", "Hamdi", "Saadi", "Chaoui",
  "Rahmani", "Toumi", "Ferhat", "Belhadj", "Messaoudi", "Khelifi", "Bouzid",
  "Gharbi", "Trabelsi", "Jelassi", "Ayari", "Sassi", "Zouari", "Mejri",
  "Bouaziz", "Karray", "Nasri", "Slimani", "Boudiaf", "Larbi", "Hamidi",
  "Djebbar", "Meziane", "Ouali", "Bensalah", "Kaddour", "Amrani", "Fassi",
];

let addressCounter = 0;

function makeIdentity(): { displayName: string; email: string } {
  const given = pick(GIVEN_NAMES);
  const family = pick(FAMILY_NAMES);

  // The local part is derived from the name so the data reads naturally; the
  // counter is what actually guarantees uniqueness.
  const local = `${given}.${family}`
    .toLowerCase()
    .replace(/[^a-z.]+/g, "");

  addressCounter++;

  return {
    displayName: `${given} ${family}`,
    email: `${local}${addressCounter}@${BOT_EMAIL_DOMAIN}`,
  };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Registers one account the way registerAction does: validate with the same
 * schema, reject a duplicate address, hash, insert. Role is never passed, so
 * everyone lands as a plain "user" exactly as a real sign-up would.
 *
 * Two things the server action does are deliberately not repeated here. The
 * per-IP rate limit belongs to an HTTP request and there is no request. And
 * signIn() issues a session cookie, which a script has no use for — the domain
 * functions below take a user object, not a session.
 */
async function registerBotUser(): Promise<CurrentUser> {
  // Nobody can register without a promoter's code, so the bot needs one too.
  // The seeded admin is the root of the tree and always exists, which is also
  // what a real first user has to rely on.
  const promoter = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true, referralCode: true },
  });

  if (!promoter) {
    throw new Error("No admin to refer bot accounts from — run `npm run db:seed` first.");
  }

  // A previous run that was interrupted before its cleanup leaves accounts
  // behind, and the same seed then regenerates the same addresses. Registering
  // is the one step that must not abort a run over that, so a taken address is
  // simply skipped — exactly as a person would pick another one.
  for (let attempt = 0; attempt < 50; attempt++) {
    const identity = makeIdentity();

    const parsed = registerSchema.safeParse({
      ...identity,
      password: BOT_PASSWORD,
      referralCode: promoter.referralCode,
    });

    if (!parsed.success) {
      throw new Error(`Bot identity failed the real register schema: ${parsed.error.message}`);
    }

    const { displayName, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing) continue;

    return prisma.user.create({
      data: {
        displayName,
        email,
        passwordHash: await hashPassword(password),
        referralCode: await mintReferralCode(),
        referredById: promoter.id,
      },
      select: { id: true, email: true, displayName: true, role: true, createdAt: true },
    });
  }

  throw new Error(
    "Could not find a free address after 50 tries. Run `npm run bot:clean` to clear an earlier run.",
  );
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

let failures = 0;

/** Unwraps a domain result, recording a failure instead of throwing. */
function check(label: string, result: { ok: boolean; error?: string }): boolean {
  if (result.ok) return true;
  failures++;
  console.log(`    FAIL  ${label}: ${result.error ?? "no reason given"}`);
  return false;
}

// ---------------------------------------------------------------------------
// How far each deal gets
// ---------------------------------------------------------------------------
//
// A live service is not all completed deals, and the admin screens are only
// worth looking at when something is waiting in them. Weighted to match.

type Stage =
  | "awaiting_counterparty"
  | "awaiting_credentials"
  | "one_side_deposited"
  | "admin_verifying"
  | "credentials_released"
  | "half_confirmed"
  | "disputed"
  | "settled";

/**
 * The two payment stages are gone — a swap has nothing to pay, so no deal can
 * ever sit in them. Two stages that only a swap has took their share:
 *
 *   one_side_deposited — one account is in and the other is not. This is the
 *     moment a swap is most exposed, and the one the timeline had to learn to
 *     describe, so the bot should always leave some deals sitting in it.
 *   half_confirmed — released, and one party has confirmed. A swap does not
 *     close until both do, so this is where a stalled one waits.
 */
const STAGE_MIX: [Stage, number][] = [
  ["settled", 0.55],
  ["one_side_deposited", 0.1],
  ["admin_verifying", 0.07],
  ["credentials_released", 0.07],
  ["half_confirmed", 0.07],
  ["awaiting_credentials", 0.05],
  ["awaiting_counterparty", 0.05],
  ["disputed", 0.04],
];

const STAGE_NAMES = STAGE_MIX.map(([stage]) => stage);

/**
 * BOT_STAGE=payment_submitted holds every deal at one stage, for when you are
 * working on a single screen and want a queue full of exactly that.
 */
const FORCED_STAGE = process.env.BOT_STAGE as Stage | undefined;

if (FORCED_STAGE && !STAGE_NAMES.includes(FORCED_STAGE)) {
  throw new Error(`BOT_STAGE must be one of: ${STAGE_NAMES.join(", ")}`);
}

function stageFor(index: number): Stage {
  if (FORCED_STAGE) return FORCED_STAGE;

  // The first deal always runs the whole way, so a smoke run of 1 is meaningful.
  if (index === 0) return "settled";

  let roll = random();

  for (const [stage, share] of STAGE_MIX) {
    if (roll < share) return stage;
    roll -= share;
  }

  return "settled";
}

// ---------------------------------------------------------------------------
// One deal, start to finish
// ---------------------------------------------------------------------------

async function runOneDeal(index: number, admin: CurrentUser) {
  const stage = stageFor(index);
  const account = accountPool[index % accountPool.length];

  const seller = await registerBotUser();
  const buyer = await registerBotUser();

  // What the other side puts up. Taken from further along the pool so the two
  // descriptions on a swap are never the same account.
  const counterAccount = accountPool[(index + 3) % accountPool.length];

  // Submitted as strings through the same schema the form uses, so a change to
  // validation breaks this run rather than silently passing.
  const parsed = createDealSchema.safeParse({
    side: "seller",
    game: account.game,

    accountSummary: account.summary,
    platform: account.platform,
    level: String(between(8, 90)),
    // Both sides above the referral bar. The bot exists to produce deals that
    // behave like real ones end to end, and a swap under the bar completes
    // without ever crediting a promoter — which would make the earnings side
    // of a bot run look broken rather than deliberate.
    teamStrength: String(between(3_050, 3_600)),
    ...epicsFor(index),

    counterAccountSummary: counterAccount.summary,
    counterPlatform: counterAccount.platform,
    counterLevel: String(between(8, 90)),
    counterTeamStrength: String(between(3_050, 3_600)),
    ...epicsFor(index + 3, "counter"),
  });

  if (!parsed.success) {
    failures++;
    console.log(`  [${index + 1}] FAIL  the description did not pass createDealSchema`);
    return;
  }

  const created = await createDeal({ creator: seller, ...parsed.data });

  if (!created.ok) {
    failures++;
    console.log(`  [${index + 1}] FAIL  createDeal: ${created.error}`);
    return;
  }

  const { dealId, reference, inviteCode } = created;

  const line = (note: string) =>
    console.log(
      `  [${String(index + 1).padStart(3)}] ${reference}  ` +
        `${seller.displayName} ⇄ ${buyer.displayName}  ${note}`,
    );

  // --- the buyer joins -----------------------------------------------------
  if (stage === "awaiting_counterparty") {
    line("waiting for a counterparty");
    return;
  }

  if (!check("joinDealByCode", await joinDealByCode(buyer, inviteCode))) return;

  await postMessage(buyer, dealId, "Joined. Ready when you are.");

  if (stage === "awaiting_credentials") {
    line("waiting on both accounts");
    return;
  }

  // --- both sides deposit their account ------------------------------------
  // Obviously fake logins. Nothing here is, or resembles, a real credential.
  const deposit = (party: CurrentUser, who: "seller" | "buyer") =>
    depositCredentials(party, dealId, {
      loginEmail: `bot-fixture-${index}-${who}@${BOT_EMAIL_DOMAIN}`,
      loginPassword: `not-a-real-password-${index}-${who}`,
      recoveryEmail: random() < 0.5 ? `bot-recovery-${index}-${who}@${BOT_EMAIL_DOMAIN}` : "",
      recoveryEmailPassword: "",
      notes: account.statesACatch
        ? "Limitation stated in the description. Bot fixture."
        : "Bot fixture — no real account behind this.",
    });

  if (!check("depositCredentials (seller)", await deposit(seller, "seller"))) return;

  await postMessage(seller, dealId, "My account is in. Put yours up when you can.");

  // The state only a swap has: one account deposited, the other not. Nothing
  // is released, and the person who went first is exposed to exactly nothing —
  // which is the property worth being able to see on screen.
  if (stage === "one_side_deposited") {
    line("one account in, waiting on the other");
    return;
  }

  if (!check("depositCredentials (buyer)", await deposit(buyer, "buyer"))) return;

  await postMessage(buyer, dealId, "Mine is in too. Over to the admin.");

  if (stage === "admin_verifying") {
    line("both accounts in, being verified");
    return;
  }

  // --- the admin checks both, then releases them together -------------------
  if (!check("approveDelivery", await approveDelivery(admin, dealId))) return;

  // --- each side reads the account they received ---------------------------
  if (!check("revealDeliveredCredentials (buyer)", await revealDeliveredCredentials(buyer, dealId))) {
    return;
  }

  if (!check("revealDeliveredCredentials (seller)", await revealDeliveredCredentials(seller, dealId))) {
    return;
  }

  // --- the Konami code step ------------------------------------------------
  // Roughly half of real transfers need one, and it is where claims stall.
  if (random() < 0.5) {
    const asked = await requestTransferCode(buyer, dealId, "Konami is asking for a code.");

    if (asked.ok) {
      check(
        "sendTransferCode",
        await sendTransferCode(seller, dealId, String(between(100_000, 999_999))),
      );
    }
  }

  if (stage === "credentials_released") {
    line("both accounts released, both claiming");
    return;
  }

  // --- it goes wrong -------------------------------------------------------
  if (stage === "disputed") {
    check(
      "openDispute",
      await openDispute(
        buyer,
        dealId,
        "Login is not being accepted",
        "The account details were released but the login is rejected every time I try it. Asked the other side twice.",
      ),
    );
    line("disputed, waiting on the admin");
    return;
  }

  // --- both confirm; the deal closes only on the second ---------------------
  if (!check("confirmClaimed (buyer)", await confirmClaimed(buyer, dealId))) return;

  // Still open: one confirmation is not a completed swap. Worth leaving deals
  // here, because it is the state where a promoter has earned nothing yet and
  // someone is waiting on a person who has gone quiet.
  if (stage === "half_confirmed") {
    line("one side confirmed, waiting on the other");
    return;
  }

  if (!check("confirmClaimed (seller)", await confirmClaimed(seller, dealId))) return;

  // Nothing is paid out to either trader — a swap has no money in it. What the
  // completion above did trigger is the $2 to each side's promoter, written by
  // creditReferralsForDeal inside confirmClaimed.
  const credited = await prisma.referralEarning.count({ where: { dealId } });

  // --- both sides review each other ----------------------------------------
  const aboutSeller = sellerReviewPool[index % sellerReviewPool.length];
  const aboutBuyer = buyerReviewPool[index % buyerReviewPool.length];

  check("leaveReview (buyer → seller)", await leaveReview(buyer, dealId, aboutSeller.rating, aboutSeller.comment));
  check("leaveReview (seller → buyer)", await leaveReview(seller, dealId, aboutBuyer.rating, aboutBuyer.comment));

  line(
    `completed · ${aboutSeller.rating}★ / ${aboutBuyer.rating}★ · ${credited} promoter credit${credited === 1 ? "" : "s"}`,
  );
}

// ---------------------------------------------------------------------------

/** Host only — never the credentials. */
function targetHost(): string {
  try {
    return new URL(connectionString!).hostname;
  } catch {
    return "unknown";
  }
}

async function main() {
  // Always say where the writes are going. The guard stops the obvious mistake;
  // this one catches "I thought DATABASE_URL was pointing somewhere else".
  console.log(`Deal bot: ${TOTAL} deal(s), seed ${SEED}`);
  console.log(`Database: ${targetHost()}\n`);

  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true, email: true, displayName: true, role: true, createdAt: true },
  });

  if (!admin) {
    throw new Error(
      "No admin user exists, and the escrow cannot confirm a payment or release an account without one.\nRun `npm run db:seed` first, or `npm run make:admin`.",
    );
  }

  console.log(`Admin: ${admin.displayName}. Every deal is an account-for-account swap.\n`);

  const started = performance.now();

  for (let index = 0; index < TOTAL; index++) {
    await runOneDeal(index, admin);
  }

  const seconds = (performance.now() - started) / 1000;

  // --- what the run produced -----------------------------------------------
  const where = { email: { endsWith: `@${BOT_EMAIL_DOMAIN}` } };
  const traders = await prisma.user.findMany({ where, select: { id: true } });
  const traderIds = traders.map((t) => t.id);

  const byStatus = await prisma.deal.groupBy({
    by: ["status"],
    where: { sellerId: { in: traderIds } },
    _count: { _all: true },
  });

  const reviews = await prisma.review.count({ where: { authorId: { in: traderIds } } });

  console.log(`\n${traders.length} accounts registered, ${reviews} reviews written, in ${seconds.toFixed(1)}s.`);
  console.log("\nDeals by status:");
  for (const row of byStatus.sort((a, b) => b._count._all - a._count._all)) {
    console.log(`  ${String(row._count._all).padStart(4)}  ${row.status}`);
  }

  // A swap must carry no money at all, same check as test:load. This used to
  // assert that fee + payout added back to the price; with every figure zero
  // that passed no matter what, so it now asserts the figures really are zero.
  const [{ bad }] = await prisma.$queryRawUnsafe<{ bad: bigint }[]>(
    `SELECT count(*) AS bad FROM "Deal"
     WHERE "tradeKind" = 'swap'
       AND ("agreedPriceCents" <> 0 OR "feeCents" <> 0 OR "sellerPayoutCents" <> 0)`,
  );

  console.log(`\n${bad === BigInt(0) ? "PASS" : "FAIL"}  no swap carries money (${bad} with a non-zero amount)`);

  if (bad !== BigInt(0)) failures++;

  // Every completed swap should owe its two promoters $2 each. Zero credits on
  // a finished swap means crediting silently stopped working, which nobody
  // would otherwise notice — the promoter has no way to know what they were owed.
  //
  // Swaps only. Archived cash deals closed before the programme existed and are
  // deliberately never credited; counting them here would report a permanent
  // failure that is actually correct behaviour.
  const [{ uncredited }] = await prisma.$queryRawUnsafe<{ uncredited: bigint }[]>(
    `SELECT count(*) AS uncredited FROM "Deal" d
     WHERE d.status = 'completed' AND d."tradeKind" = 'swap'
       AND NOT EXISTS (SELECT 1 FROM "ReferralEarning" r WHERE r."dealId" = d.id)`,
  );

  console.log(
    `${uncredited === BigInt(0) ? "PASS" : "FAIL"}  every completed deal credited its promoters (${uncredited} missed)`,
  );

  if (uncredited !== BigInt(0)) failures++;

  if (failures > 0) {
    console.log(`\n${failures} step(s) failed. Reproduce this exact run with BOT_SEED=${SEED}.`);
    process.exitCode = 1;
  } else {
    console.log("\nEvery step succeeded.");
  }
}

async function cleanup() {
  // Deals, credentials, messages, reviews and transfer codes all cascade from
  // the users, so deleting the traders removes the whole run.
  const deals = await prisma.deal.deleteMany({
    where: { seller: { email: { endsWith: `@${BOT_EMAIL_DOMAIN}` } } },
  });

  const users = await prisma.user.deleteMany({
    where: { email: { endsWith: `@${BOT_EMAIL_DOMAIN}` } },
  });

  console.log(`\nCleaned up ${deals.count} deal(s) and ${users.count} account(s).`);
}

const run = CLEAN_ONLY ? Promise.resolve() : main();

run
  .catch((error) => {
    console.error("\nDeal bot failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!CLEAN_ONLY && process.env.KEEP_BOT_DATA === "1") {
      console.log("\nKEEP_BOT_DATA=1 — leaving the data in place.");
      console.log(`Sign in as any of them with the password: ${BOT_PASSWORD}`);
      console.log(`Remove them later with: npm run bot:clean`);
    } else {
      await cleanup();
    }

    await prisma.$disconnect();
  });
