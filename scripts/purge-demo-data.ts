// Removes seeded and bot-generated demo data from a database.
//
//   npm run purge:demo            report what would go, change nothing
//   npm run purge:demo -- --apply actually delete it
//
// The same logic the admin console uses, from a terminal. Whichever database
// DATABASE_URL points at is the one that gets cleaned, so check the host it
// prints before passing --apply.
//
// DRY RUN BY DEFAULT. Deleting accounts is not something to do on a typo.
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { purgeDemoData, surveyDemoData } from "../src/lib/demo-data";
import type { CurrentUser } from "../src/lib/dal";

const APPLY = process.argv.includes("--apply");

function targetHost(): string {
  try {
    return new URL(process.env.DATABASE_URL!).hostname;
  } catch {
    return "unknown";
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");

  console.log(`Database: ${targetHost()}`);
  console.log(APPLY ? "Mode:     APPLY — this will delete\n" : "Mode:     dry run — nothing will change\n");

  const survey = await surveyDemoData();

  for (const admin of survey.adminsKept) {
    console.log(`  KEEPING admin ${admin.email} — an admin is never deleted.`);
  }

  if (survey.accounts === 0) {
    console.log("\nNo demo accounts found. Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  console.log(`  ${survey.accounts} demo account(s)`);
  console.log(`  ${survey.deals} deal(s) they were part of`);
  console.log(`  ${survey.reviews} review(s) written on those deals`);
  console.log(`  ${survey.earnings} referral credit(s)`);
  console.log(`  ${survey.withdrawals} withdrawal(s)`);

  if (survey.sample.length > 0) {
    console.log("\n  For example:");
    for (const review of survey.sample) {
      console.log(`    "${review.comment}" — ${review.authorName}`);
    }
  }

  if (survey.realReviewsAtRisk > 0) {
    console.log(
      `\n  WARNING  ${survey.realReviewsAtRisk} of those reviews were written by an account that is NOT demo data.`,
    );
    console.log("           Check those before applying — they may be real.");
  }

  console.log(
    `\n  Left standing afterwards: ${survey.realReviewsRemaining} review(s), ${survey.realCompletedDealsRemaining} completed deal(s).`,
  );

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to delete.");
    await prisma.$disconnect();
    return;
  }

  console.log("\nDeleting…");

  // The library refuses anything that is not an admin, so the script hands it
  // one. There is no session here; the guard that matters is DATABASE_URL,
  // printed above.
  const asAdmin = { role: "admin" } as CurrentUser;
  const result = await purgeDemoData(asAdmin);

  if (!result.ok) {
    console.error(`\nFailed: ${result.error}`);
    process.exitCode = 1;
  } else {
    console.log(`  ${result.deals} deal(s) and ${result.accounts} account(s) deleted.`);
    console.log("\nWhat is left is real. If that is zero, the reviews page now says so honestly.");
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("\nPurge failed:");
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
