// Finding and removing invented people. SERVER ONLY.
//
// The seed and the deal bot both create accounts, complete deals in their names
// and write reviews from them. On a local database that is fixture data and the
// whole point. On the live site it is fabricated social proof on a service
// whose only real asset is being the one that does not lie.
//
// Both scripts carry a guard meant to stop them reaching production. This is
// the tool for when one of them got through anyway — and it is reachable from
// the admin console rather than only from a terminal, because whoever needs it
// most is the person who cannot open a terminal against the live database.
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/dal";

/**
 * Every address demo data is written under.
 *
 * All three are unroutable or reserved on purpose, so nothing matching them can
 * belong to a real person:
 *
 *   @pesescrow.test        the seed's named fixtures (admin, sami, karim, ...)
 *   @demo.pesescrow.test   the seed's review-wall traders
 *   @deal-bot.invalid      every account run-deal-bot.ts registers
 *
 * .test and .invalid are reserved by RFC 2606 and can never resolve, which is
 * what makes matching on them safe rather than a guess.
 */
export const DEMO_EMAIL_SUFFIXES = [
  "@pesescrow.test",
  "@demo.pesescrow.test",
  "@deal-bot.invalid",
] as const;

const emailFilter = {
  OR: DEMO_EMAIL_SUFFIXES.map((suffix) => ({ email: { endsWith: suffix } })),
};

export type DemoDataSurvey = {
  /** Demo accounts that would be deleted. */
  accounts: number;
  /** Admins that matched but are deliberately kept. */
  adminsKept: { email: string }[];
  deals: number;
  reviews: number;
  earnings: number;
  withdrawals: number;
  /**
   * Reviews on a demo deal written by an account that is NOT demo data.
   *
   * Should be zero. If it is not, a real person reviewed a fake deal, and
   * deleting it destroys something genuine — worth seeing before, not after.
   */
  realReviewsAtRisk: number;
  /** A few review lines, so the admin can see what they are about to remove. */
  sample: { comment: string; authorName: string; createdAt: Date }[];
  /** What is left once the demo data goes. */
  realReviewsRemaining: number;
  realCompletedDealsRemaining: number;
};

/** Ids of the accounts that would go, and of the deals that must go first. */
async function targets(): Promise<{ userIds: string[]; dealIds: string[]; adminsKept: { email: string }[] }> {
  const matched = await prisma.user.findMany({
    where: emailFilter,
    select: { id: true, email: true, role: true },
  });

  // Never an admin, under any circumstances.
  //
  // The seeded admin lives on @pesescrow.test and would otherwise match. On a
  // live site that account is the only way into the console, and deleting it is
  // unrecoverable through the UI — there is no password reset, and no way to
  // promote a replacement without already being one.
  const adminsKept = matched.filter((user) => user.role === "admin").map(({ email }) => ({ email }));
  const userIds = matched.filter((user) => user.role !== "admin").map((user) => user.id);

  if (userIds.length === 0) return { userIds, dealIds: [], adminsKept };

  const deals = await prisma.deal.findMany({
    where: {
      OR: [
        { createdById: { in: userIds } },
        { sellerId: { in: userIds } },
        { buyerId: { in: userIds } },
      ],
    },
    select: { id: true },
  });

  return { userIds, dealIds: deals.map((deal) => deal.id), adminsKept };
}

export async function surveyDemoData(): Promise<DemoDataSurvey> {
  const { userIds, dealIds, adminsKept } = await targets();

  const [reviews, earnings, withdrawals, realReviewsAtRisk, sample] = await Promise.all([
    prisma.review.count({ where: { dealId: { in: dealIds } } }),
    prisma.referralEarning.count({ where: { dealId: { in: dealIds } } }),
    prisma.withdrawal.count({ where: { promoterId: { in: userIds } } }),
    prisma.review.count({ where: { dealId: { in: dealIds }, authorId: { notIn: userIds } } }),
    prisma.review.findMany({
      where: { dealId: { in: dealIds }, comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { comment: true, createdAt: true, author: { select: { displayName: true } } },
    }),
  ]);

  // What survives. Counted by exclusion rather than by trusting the delete to
  // have worked, so the number shown is the number that will actually remain.
  const [realReviewsRemaining, realCompletedDealsRemaining] = await Promise.all([
    prisma.review.count({ where: { dealId: { notIn: dealIds } } }),
    prisma.deal.count({ where: { status: "completed", id: { notIn: dealIds } } }),
  ]);

  return {
    accounts: userIds.length,
    adminsKept,
    deals: dealIds.length,
    reviews,
    earnings,
    withdrawals,
    realReviewsAtRisk,
    sample: sample.map((row) => ({
      comment: row.comment ?? "",
      authorName: row.author.displayName,
      createdAt: row.createdAt,
    })),
    realReviewsRemaining,
    realCompletedDealsRemaining,
  };
}

export type PurgeResult =
  | { ok: true; accounts: number; deals: number }
  | { ok: false; error: string };

/**
 * Deletes it.
 *
 * Order matters: a Deal requires its creator, so Postgres refuses to remove a
 * user who opened one. The deal goes first, and everything hanging off it —
 * credentials, messages, reviews, disputes, referral credits — cascades with it.
 */
export async function purgeDemoData(admin: CurrentUser): Promise<PurgeResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const { userIds, dealIds } = await targets();

  if (userIds.length === 0) return { ok: true, accounts: 0, deals: 0 };

  const removedDeals = await prisma.deal.deleteMany({ where: { id: { in: dealIds } } });
  await prisma.withdrawal.deleteMany({ where: { promoterId: { in: userIds } } });
  const removedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  return { ok: true, accounts: removedUsers.count, deals: removedDeals.count };
}
