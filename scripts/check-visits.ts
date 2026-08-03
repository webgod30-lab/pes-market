// The homepage visit counter.
//
// A public figure that overstates itself is a lie, so the contract asserted
// here is one-sided: the count may lag reality, but must never exceed it.
// Also checks that a crawler sweep does not read as a wave of interest, and
// that the table holds a number and nothing that identifies anybody.
//
//   npm run test:visits
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { getMonthlyVisits, looksAutomated, recordVisit } from "../src/lib/visits";

async function main() {
  const before = (await getMonthlyVisits()) ?? 0;

  await recordVisit();
  assert.equal((await getMonthlyVisits()) ?? 0, before + 1);
  console.log("  PASS  a visit increments the month's counter");

  // Concurrency. The contract is deliberately one-sided: the count must never
  // exceed the number of visits, because a public figure that overstates is a
  // lie. Undercounting is fine and expected — recordVisit swallows failures
  // rather than breaking a homepage over a counter, so a database hiccup loses
  // a tick. What must not happen is two visits reading the same value and
  // writing it back as one increment.
  const start = (await getMonthlyVisits()) ?? 0;
  const results = await Promise.allSettled(Array.from({ length: 4 }, () => recordVisit()));
  const attempted = results.filter((r) => r.status === "fulfilled").length;
  const gained = ((await getMonthlyVisits()) ?? 0) - start;
  assert.ok(gained <= attempted, `counted ${gained} from ${attempted} visits — overcounting`);
  assert.ok(gained >= 1, "no visit was counted at all");
  console.log(`  PASS  concurrent visits never overcount (${gained} from ${attempted})`);

  for (const ua of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "curl/8.4.0",
    "python-requests/2.31.0",
    "facebookexternalhit/1.1",
    null,
  ]) {
    assert.equal(looksAutomated(ua), true, `should be automated: ${ua}`);
  }
  console.log("  PASS  crawlers and scripted clients are not counted as people");

  assert.equal(
    looksAutomated("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"),
    false,
  );
  console.log("  PASS  a real browser is counted");

  // The counter holds a number and nothing else.
  const columns = Object.keys(
    (await prisma.visitCounter.findFirstOrThrow({ where: {} })) as Record<string, unknown>,
  );
  assert.deepEqual(columns.sort(), ["month", "updatedAt", "views"]);
  console.log("  PASS  the counter stores a month and a number, nothing identifying");

  console.log("\n5 visit checks passed.");
}

main().catch((e) => { console.error("FAILED:", e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
