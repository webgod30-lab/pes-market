// Counting how many people look at the site. SERVER ONLY.
//
// Why this exists at all, when the site already runs Vercel Analytics: that
// data lives in Vercel's dashboard and there is no runtime API to read your own
// numbers back into a page. To show a figure on the homepage, the app has to
// count it itself.
//
// It counts VISITS, not visitors. Telling two people apart requires giving each
// one an identifier and remembering it — a cookie, a fingerprint, something.
// The privacy policy says this site sets no cookie and assigns no identifier,
// and that is worth more than a slightly better number on the homepage. So this
// counts page loads, and is labelled as such wherever it is shown.
import { prisma } from "@/lib/prisma";

/**
 * Below this, the figure is hidden rather than shown.
 *
 * A trust band exists to reassure someone who is about to hand over an account
 * or a few hundred dollars. "19 visits this month" does the opposite — it says
 * the place is empty. Numbers only help once they are worth showing. Raise or
 * lower this freely; setting it to 0 always shows the figure.
 */
export const VISITS_WORTH_SHOWING = 250;

/** Calendar month key, e.g. "2026-08". */
function monthKey(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Anything that is plainly not a person.
 *
 * Not exhaustive and cannot be — the point is to stop a crawler sweep reading
 * as a wave of interest, not to win an arms race.
 */
const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|axios|node-fetch|postman/i;

export function looksAutomated(userAgent: string | null): boolean {
  if (!userAgent) return true;

  return BOT_PATTERN.test(userAgent);
}

/**
 * Records one visit.
 *
 * Deliberately never throws: this is decoration on a page that must render
 * even with no database at all, and a counter is not worth breaking a homepage
 * over. The upsert increments atomically, so simultaneous visitors cannot read
 * the same count and write it back.
 */
export async function recordVisit(now = new Date()): Promise<void> {
  const month = monthKey(now);

  try {
    await prisma.visitCounter.upsert({
      where: { month },
      create: { month, views: 1 },
      update: { views: { increment: 1 } },
    });
  } catch {
    // Counting is not worth a 500.
  }
}

/** Visits so far this calendar month, or null if it cannot be read. */
export async function getMonthlyVisits(now = new Date()): Promise<number | null> {
  try {
    const row = await prisma.visitCounter.findUnique({
      where: { month: monthKey(now) },
      select: { views: true },
    });

    return row?.views ?? 0;
  } catch {
    return null;
  }
}
