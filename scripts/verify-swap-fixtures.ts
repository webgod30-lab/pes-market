// Independent check on a run of scripts/run-swap-fixtures.ts.
//
//   npx tsx scripts/verify-swap-fixtures.ts --log swap-fixture-run.json
//
// Reads the deal references out of the run log and asks the database what
// actually happened to them, rather than trusting the runner's own report.
// Also counts the two things that leak into public numbers: referral credits
// and reviews.
import "dotenv/config";

import { readFileSync } from "node:fs";

import { prisma } from "../src/lib/prisma";

const argv = process.argv.slice(2);

function option(name: string): string | null {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : (argv[i + 1] ?? null);
}

const LOG_PATH = option("log") ?? "swap-fixture-run.json";

type RunLog = {
  target: string;
  ranAt: string;
  results: { swap_ref: string; reference: string | null; finalStatus: string | null }[];
};

async function main(): Promise<void> {
  const log = JSON.parse(readFileSync(LOG_PATH, "utf8")) as RunLog;
  const refs = log.results.map((r) => r.reference).filter((r): r is string => Boolean(r));

  console.log(`\n  log     : ${LOG_PATH}`);
  console.log(`  target  : ${log.target}`);
  console.log(`  ran at  : ${log.ranAt}`);
  console.log(`  deals   : ${refs.length} references\n`);

  const deals = await prisma.deal.findMany({
    where: { reference: { in: refs } },
    select: {
      reference: true,
      status: true,
      tradeKind: true,
      sellerConfirmedAt: true,
      buyerConfirmedAt: true,
      credentials: { select: { side: true } },
    },
    orderBy: { reference: "asc" },
  });

  let completed = 0;

  for (const deal of deals) {
    const sides = deal.credentials.map((c) => c.side).sort().join("+") || "none";
    const both = Boolean(deal.sellerConfirmedAt && deal.buyerConfirmedAt);

    if (deal.status === "completed") completed++;

    console.log(
      `   ${deal.reference}  ${deal.status.padEnd(12)} ${deal.tradeKind.padEnd(5)} ` +
        `credentials=${sides.padEnd(13)} bothConfirmed=${both}`,
    );
  }

  const credits = await prisma.referralEarning.count({
    where: { deal: { reference: { in: refs } } },
  });

  const reviews = await prisma.review.count({
    where: { deal: { reference: { in: refs } } },
  });

  console.log(`\n  ${completed}/${refs.length} completed in the database`);
  console.log(`  referral credits written by these deals : ${credits}`);
  console.log(`  reviews written by these deals          : ${reviews}\n`);

  // The whole public trust surface, counted the way the site counts it.
  const publicCompleted = await prisma.deal.count({ where: { status: "completed" } });

  console.log(`  site-wide "deals completed" counter now : ${publicCompleted}`);
  console.log(`  (of which these fixtures account for    : ${completed})\n`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
