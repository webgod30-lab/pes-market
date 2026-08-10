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
// them start where a real person starts. This one registers a brand new seller
// and a brand new buyer for every deal and then plays the whole thing out —
// create, invite, join, deposit, pay, verify, release, the Konami code exchange,
// claim, payout, and both reviews — checking the result of every step.
//
// So it answers a question the others cannot: can two people who signed up a
// minute ago actually complete a trade, using only the routes the UI offers?
//
// LOCAL ONLY. See the guard below.
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/passwords";
import { registerSchema, createDealSchema } from "../src/lib/validation";
import {
  approveDelivery,
  confirmClaimed,
  confirmPaymentReceived,
  createDeal,
  depositCredentials,
  joinDealByCode,
  markPayoutSent,
  revealDeliveredCredentials,
  submitPayment,
} from "../src/lib/deals";
import { postMessage } from "../src/lib/messages";
import { leaveReview } from "../src/lib/reviews";
import { openDispute } from "../src/lib/disputes";
import { requestTransferCode, sendTransferCode } from "../src/lib/transfer-codes";
import { ACCOUNTS, SELLER_REVIEWS, BUYER_REVIEWS } from "./bot-content";
import type { CurrentUser } from "../src/lib/dal";
import type { PaymentMethod } from "../src/generated/prisma/client";

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
  // A previous run that was interrupted before its cleanup leaves accounts
  // behind, and the same seed then regenerates the same addresses. Registering
  // is the one step that must not abort a run over that, so a taken address is
  // simply skipped — exactly as a person would pick another one.
  for (let attempt = 0; attempt < 50; attempt++) {
    const identity = makeIdentity();

    const parsed = registerSchema.safeParse({ ...identity, password: BOT_PASSWORD });

    if (!parsed.success) {
      throw new Error(`Bot identity failed the real register schema: ${parsed.error.message}`);
    }

    const { displayName, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing) continue;

    return prisma.user.create({
      data: { displayName, email, passwordHash: await hashPassword(password) },
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
  | "awaiting_payment"
  | "payment_submitted"
  | "admin_verifying"
  | "credentials_released"
  | "disputed"
  | "settled";

const STAGE_MIX: [Stage, number][] = [
  ["settled", 0.55],
  ["payment_submitted", 0.1],
  ["admin_verifying", 0.07],
  ["credentials_released", 0.07],
  ["awaiting_payment", 0.07],
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

async function runOneDeal(index: number, admin: CurrentUser, paymentMethods: PaymentMethodChoice[]) {
  const stage = stageFor(index);
  const account = accountPool[index % accountPool.length];

  const seller = await registerBotUser();
  const buyer = await registerBotUser();

  // Prices are invented, but tied to the account so the numbers are not absurd:
  // a starter account and a 52-Epic collection should not cost the same.
  const basePrice = account.statesACatch ? between(2_500, 18_000) : between(2_000, 48_000);

  // Submitted as strings through the same schema the form uses, so a change to
  // validation breaks this run rather than silently passing.
  const parsed = createDealSchema.safeParse({
    side: "seller",
    accountSummary: account.summary,
    game: account.game,
    platform: account.platform,
    level: String(between(8, 90)),
    agreedPriceCents: (basePrice / 100).toFixed(2),
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
  const price = parsed.data.agreedPriceCents;

  const line = (note: string) =>
    console.log(
      `  [${String(index + 1).padStart(3)}] ${reference}  $${(price / 100).toFixed(2).padStart(7)}  ` +
        `${seller.displayName} → ${buyer.displayName}  ${note}`,
    );

  // --- the buyer joins -----------------------------------------------------
  if (stage === "awaiting_counterparty") {
    line("waiting for a counterparty");
    return;
  }

  if (!check("joinDealByCode", await joinDealByCode(buyer, inviteCode))) return;

  await postMessage(buyer, dealId, "Joined. Ready when you are.");

  if (stage === "awaiting_credentials") {
    line("waiting on the seller's account details");
    return;
  }

  // --- the seller deposits the account -------------------------------------
  // Obviously fake logins. Nothing here is, or resembles, a real credential.
  if (
    !check(
      "depositCredentials",
      await depositCredentials(seller, dealId, {
        loginEmail: `bot-fixture-${index}@${BOT_EMAIL_DOMAIN}`,
        loginPassword: `not-a-real-password-${index}`,
        recoveryEmail: random() < 0.5 ? `bot-recovery-${index}@${BOT_EMAIL_DOMAIN}` : "",
        recoveryEmailPassword: "",
        notes: account.statesACatch
          ? "Limitation stated in the description. Bot fixture."
          : "Bot fixture — no real account behind this.",
      }),
    )
  ) {
    return;
  }

  await postMessage(seller, dealId, "Account details are in. Have a look when you get a chance.");

  if (stage === "awaiting_payment") {
    line("account deposited, waiting on payment");
    return;
  }

  // --- the buyer pays ------------------------------------------------------
  const method = pick(paymentMethods);

  if (
    !check(
      "submitPayment",
      await submitPayment(buyer, dealId, {
        method: method.method,
        txHash: method.method === "crypto" ? `0xbot${index.toString(16).padStart(8, "0")}` : null,
        reference: method.method === "crypto" ? null : `BOT-REF-${index}`,
        instructionsSnapshot: method.instructions,
      }),
    )
  ) {
    return;
  }

  if (stage === "payment_submitted") {
    line(`paid by ${method.label}, waiting on the admin`);
    return;
  }

  // --- the admin confirms the money and checks the account ------------------
  if (!check("confirmPaymentReceived", await confirmPaymentReceived(admin, dealId))) return;

  if (stage === "admin_verifying") {
    line("payment confirmed, account being verified");
    return;
  }

  if (!check("approveDelivery", await approveDelivery(admin, dealId))) return;

  // --- the buyer reads the account -----------------------------------------
  const revealed = await revealDeliveredCredentials(buyer, dealId);

  if (!check("revealDeliveredCredentials", revealed)) return;

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
    line("account released, buyer is claiming it");
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
        "The account details were released but the login is rejected every time I try it. Asked the seller twice.",
      ),
    );
    line("disputed, waiting on the admin");
    return;
  }

  // --- the buyer confirms and the seller is paid ---------------------------
  if (!check("confirmClaimed", await confirmClaimed(buyer, dealId))) return;
  if (!check("markPayoutSent", await markPayoutSent(admin, dealId, `bot-payout-${index}`))) return;

  // --- both sides review each other ----------------------------------------
  const aboutSeller = sellerReviewPool[index % sellerReviewPool.length];
  const aboutBuyer = buyerReviewPool[index % buyerReviewPool.length];

  check("leaveReview (buyer → seller)", await leaveReview(buyer, dealId, aboutSeller.rating, aboutSeller.comment));
  check("leaveReview (seller → buyer)", await leaveReview(seller, dealId, aboutBuyer.rating, aboutBuyer.comment));

  line(`completed · ${aboutSeller.rating}★ seller, ${aboutBuyer.rating}★ buyer`);
}

// ---------------------------------------------------------------------------

type PaymentMethodChoice = { method: PaymentMethod; label: string; instructions: string };

async function loadPaymentMethods(): Promise<PaymentMethodChoice[]> {
  const configured = await prisma.paymentMethodConfig.findMany({
    where: { isActive: true, isAutomatic: false },
    select: { method: true, label: true, instructions: true },
    orderBy: { sortOrder: "asc" },
  });

  if (configured.length > 0) return configured;

  // The bot should still run on a database that has never been seeded.
  return [
    { method: "crypto", label: "USDT (TRC-20)", instructions: "Bot fixture — no method configured." },
  ];
}

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

  const paymentMethods = await loadPaymentMethods();

  console.log(`Admin: ${admin.displayName}. Payment methods: ${paymentMethods.map((m) => m.label).join(", ")}\n`);

  const started = performance.now();

  for (let index = 0; index < TOTAL; index++) {
    await runOneDeal(index, admin, paymentMethods);
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

  // The money must reconcile on everything the bot created, same as test:load.
  const [{ bad }] = await prisma.$queryRawUnsafe<{ bad: bigint }[]>(
    `SELECT count(*) AS bad FROM "Deal" WHERE "feeCents" + "sellerPayoutCents" <> "agreedPriceCents"`,
  );

  console.log(`\n${bad === BigInt(0) ? "PASS" : "FAIL"}  money reconciles on every deal (${bad} mismatches)`);

  if (bad !== BigInt(0)) failures++;

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
