// Load and integrity test at realistic scale.
//
//   npm run test:load          1000 deals (default)
//   npm run test:load 5000     more
//
// Two questions this answers:
//
//   1. Does the money still reconcile across thousands of deals, or does
//      rounding drift somewhere?
//   2. Do the queries the real pages run stay fast once there are thousands of
//      rows, or does something turn into a sequential scan / N+1?
//
// LOCAL ONLY. It creates thousands of fake deals; the guard below stops it
// reaching a hosted database.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/passwords";
import { encryptCredentials } from "../src/lib/crypto";
import { splitDealMoney, defaultFeeBps } from "../src/lib/fees";
import { generateDealReference } from "../src/lib/ids";
import { listDealsForAdmin, listUsersForAdmin, getConsoleStats } from "../src/lib/admin";
import { listPublicReviews, getTrustStats, getReputation, getReputationsFor } from "../src/lib/reviews";
import { listDealsForUser } from "../src/lib/deals";
import type { DealStatus } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;

if (!url) throw new Error("DATABASE_URL is not set.");

{
  const host = new URL(url).hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  if (!isLocal && process.env.ALLOW_REMOTE_SEED !== "1") {
    throw new Error(
      `Refusing to load-test "${host}" — it is not local. This creates thousands of fake deals.`,
    );
  }
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const TOTAL = Number(process.argv[2] ?? 1000);
const TRADERS = Math.max(20, Math.round(TOTAL / 20));
const PREFIX = "loadtest";
const FEE_BPS = defaultFeeBps();

/** Realistic spread, weighted toward finished deals as a live service would be. */
const STATUS_MIX: [DealStatus, number][] = [
  ["completed", 0.55],
  ["awaiting_payment", 0.1],
  ["payment_submitted", 0.08],
  ["admin_verifying", 0.07],
  ["claiming", 0.05],
  ["awaiting_counterparty", 0.05],
  ["awaiting_credentials", 0.04],
  ["cancelled", 0.03],
  ["refunded", 0.02],
  ["disputed", 0.01],
];

function pickStatus(i: number): DealStatus {
  const r = ((i * 9301 + 49297) % 233280) / 233280; // deterministic
  let acc = 0;
  for (const [status, share] of STATUS_MIX) {
    acc += share;
    if (r < acc) return status;
  }
  return "completed";
}

async function time<T>(label: string, fn: () => Promise<T>): Promise<[T, number]> {
  const start = performance.now();
  const result = await fn();
  const ms = performance.now() - start;
  console.log(`  ${String(Math.round(ms)).padStart(6)} ms  ${label}`);
  return [result, ms];
}

async function main() {
  console.log(`Load test: ${TOTAL} deals, ${TRADERS} traders, fee ${FEE_BPS}bp\n`);

  const t0 = performance.now();

  // --- users -------------------------------------------------------------
  // One hash reused: bcrypt at cost 12 is ~250ms, and hashing hundreds of
  // times would measure bcrypt rather than the application.
  const passwordHash = await hashPassword("LoadTest123!");

  console.log("Creating traders…");
  await prisma.user.createMany({
    data: Array.from({ length: TRADERS }, (_, i) => ({
      email: `${PREFIX}-${i}@loadtest.invalid`,
      displayName: `LoadTrader ${i}`,
      passwordHash,
    })),
    skipDuplicates: true,
  });

  const traders = await prisma.user.findMany({
    where: { email: { startsWith: PREFIX } },
    select: { id: true },
  });

  const admin = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } });

  if (!admin) throw new Error("No admin user — run npm run db:seed first.");

  console.log(`  ${traders.length} traders ready\n`);

  // --- deals -------------------------------------------------------------
  const ciphertext = encryptCredentials({
    loginEmail: "load@test.invalid",
    loginPassword: "load-test-only",
    recoveryEmail: "",
    recoveryEmailPassword: "",
    notes: "",
  });

  console.log(`Creating ${TOTAL} deals…`);
  const dealStart = performance.now();

  // Small batches on purpose: the local `prisma dev` server (a wasm Postgres)
  // drops the connection under sustained bulk load. Override with LOAD_BATCH.
  const BATCH = Number(process.env.LOAD_BATCH ?? 100);
  const references = new Set<string>();
  let collisions = 0;

  for (let offset = 0; offset < TOTAL; offset += BATCH) {
    const rows = [];

    for (let i = offset; i < Math.min(offset + BATCH, TOTAL); i++) {
      const seller = traders[i % traders.length];
      const buyer = traders[(i + 7) % traders.length];
      if (seller.id === buyer.id) continue;

      // Deliberately awkward prices, to catch rounding drift.
      const price = 199 + ((i * 137) % 48_000);
      const money = splitDealMoney(price, FEE_BPS);
      const status = pickStatus(i);

      let reference = generateDealReference();
      while (references.has(reference)) {
        collisions++;
        reference = generateDealReference();
      }
      references.add(reference);

      const done = status === "completed";

      rows.push({
        id: `${PREFIX}-deal-${i}`,
        reference,
        createdById: seller.id,
        createdSide: "seller" as const,
        sellerId: seller.id,
        buyerId: status === "awaiting_counterparty" ? null : buyer.id,
        accountSummary: `Load test deal ${i}. eFootball account with a squad and some coins.`,
        game: "eFootball",
        platform: i % 2 === 0 ? "Mobile" : "PS5",
        level: 5 + (i % 70),
        agreedPriceCents: money.agreedPriceCents,
        feeBps: money.feeBps,
        feeCents: money.feeCents,
        sellerPayoutCents: money.sellerPayoutCents,
        status,
        completedAt: done ? new Date() : null,
        buyerConfirmedAt: done ? new Date() : null,
        payoutAt: done && i % 3 !== 0 ? new Date() : null,
        createdAt: new Date(Date.now() - (i % 365) * 86_400_000),
      });
    }

    await prisma.deal.createMany({ data: rows, skipDuplicates: true });
    process.stdout.write(`\r  ${Math.min(offset + BATCH, TOTAL)}/${TOTAL}`);
  }

  const dealMs = performance.now() - dealStart;
  console.log(`\n  done in ${Math.round(dealMs)} ms (${Math.round(TOTAL / (dealMs / 1000))}/sec)`);
  console.log(`  reference collisions during generation: ${collisions}\n`);

  // --- credentials + reviews on completed deals --------------------------
  const completed = await prisma.deal.findMany({
    where: { id: { startsWith: PREFIX }, status: "completed" },
    select: { id: true, sellerId: true, buyerId: true },
  });

  console.log(`Adding credentials and reviews to ${completed.length} completed deals…`);

  for (let offset = 0; offset < completed.length; offset += BATCH) {
    const slice = completed.slice(offset, offset + BATCH);

    await prisma.credential.createMany({
      data: slice.map((d) => ({ dealId: d.id, ciphertext })),
      skipDuplicates: true,
    });

    await prisma.review.createMany({
      data: slice.flatMap((d, n) => [
        {
          dealId: d.id,
          authorId: d.buyerId!,
          subjectId: d.sellerId!,
          subjectSide: "seller" as const,
          rating: 3 + ((offset + n) % 3),
          comment: `Load test review ${offset + n}. Went as expected.`,
        },
        {
          dealId: d.id,
          authorId: d.sellerId!,
          subjectId: d.buyerId!,
          subjectSide: "buyer" as const,
          rating: 4 + ((offset + n) % 2),
          comment: null,
        },
      ]),
      skipDuplicates: true,
    });
  }

  const reviewCount = await prisma.review.count({ where: { deal: { id: { startsWith: PREFIX } } } });
  console.log(`  ${reviewCount} reviews created\n`);

  // --- integrity ---------------------------------------------------------
  console.log("Integrity checks:");

  const [{ bad }] = await prisma.$queryRawUnsafe<{ bad: bigint }[]>(
    `SELECT count(*) AS bad FROM "Deal" WHERE "feeCents" + "sellerPayoutCents" <> "agreedPriceCents"`,
  );
  console.log(`  ${bad === BigInt(0) ? "PASS" : "FAIL"}  money reconciles on every deal (${bad} mismatches)`);

  const [{ dupes }] = await prisma.$queryRawUnsafe<{ dupes: bigint }[]>(
    `SELECT count(*) AS dupes FROM (SELECT reference FROM "Deal" GROUP BY reference HAVING count(*) > 1) x`,
  );
  console.log(`  ${dupes === BigInt(0) ? "PASS" : "FAIL"}  every deal reference unique (${dupes} duplicates)`);

  const [{ selfdeal }] = await prisma.$queryRawUnsafe<{ selfdeal: bigint }[]>(
    `SELECT count(*) AS selfdeal FROM "Deal" WHERE "sellerId" = "buyerId"`,
  );
  console.log(`  ${selfdeal === BigInt(0) ? "PASS" : "FAIL"}  nobody is both sides of a deal (${selfdeal})`);

  const [{ selfreview }] = await prisma.$queryRawUnsafe<{ selfreview: bigint }[]>(
    `SELECT count(*) AS selfreview FROM "Review" WHERE "authorId" = "subjectId"`,
  );
  console.log(`  ${selfreview === BigInt(0) ? "PASS" : "FAIL"}  nobody reviewed themselves (${selfreview})`);

  const totals = await prisma.deal.aggregate({
    _sum: { agreedPriceCents: true, feeCents: true, sellerPayoutCents: true },
  });
  const gross = totals._sum.agreedPriceCents ?? 0;
  const fees = totals._sum.feeCents ?? 0;
  const payouts = totals._sum.sellerPayoutCents ?? 0;
  console.log(
    `  ${gross === fees + payouts ? "PASS" : "FAIL"}  totals reconcile: $${(gross / 100).toFixed(2)} = fees $${(fees / 100).toFixed(2)} + payouts $${(payouts / 100).toFixed(2)}\n`,
  );

  // --- the queries the real pages run ------------------------------------
  const dealCount = await prisma.deal.count();
  const userCount = await prisma.user.count();
  console.log(`Page queries against ${dealCount} deals / ${userCount} users:`);

  const timings: [string, number][] = [];
  const record = async (label: string, fn: () => Promise<unknown>) => {
    const [, ms] = await time(label, fn);
    timings.push([label, ms]);
  };

  await record("/reviews          listPublicReviews(50)", () => listPublicReviews(50));
  await record("/reviews          getTrustStats", () => getTrustStats());
  await record("/admin            getConsoleStats", () => getConsoleStats());
  await record("/admin/deals      needs_action", () => listDealsForAdmin("needs_action", ""));
  await record("/admin/deals      all", () => listDealsForAdmin("all", ""));
  await record("/admin/deals      search by name", () => listDealsForAdmin("all", "LoadTrader 3"));
  await record("/admin/users      listUsersForAdmin", () => listUsersForAdmin(""));
  await record("/dashboard        listDealsForUser", () => listDealsForUser(traders[0].id));
  await record("/u/[id]           getReputation", () => getReputation(traders[0].id));

  // The users page as it actually behaves: the list plus a reputation for every
  // row. This used to be four queries per row; getReputationsFor makes it three
  // in total, which is the difference between usable and unusable at 100 rows.
  await record("/admin/users      + reputation for every row (full page)", async () => {
    const users = await listUsersForAdmin("");
    return getReputationsFor(users.map((u) => u.id));
  });

  const slow = timings.filter(([, ms]) => ms > 1000);

  console.log("");
  if (slow.length === 0) {
    console.log("  No query slower than 1s.");
  } else {
    console.log("  SLOW (>1s):");
    for (const [label, ms] of slow) console.log(`    ${Math.round(ms)}ms  ${label}`);
  }

  console.log(`\nTotal run: ${Math.round((performance.now() - t0) / 1000)}s`);
}

async function cleanup() {
  const deals = await prisma.deal.deleteMany({ where: { id: { startsWith: PREFIX } } });
  const users = await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  console.log(`\nCleaned up ${deals.count} deals and ${users.count} traders.`);
}

main()
  .catch((error) => {
    console.error("\nLoad test failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.KEEP_LOAD_DATA !== "1") await cleanup();
    await prisma.$disconnect();
  });
