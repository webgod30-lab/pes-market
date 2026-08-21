// Applications to become a promoter. SERVER ONLY.
//
// Registration needs a promoter's code, which makes this site closed: the only
// people who can get in are people who already know a member. That is the right
// shape for traders — a swap starts with two people who have already agreed
// somewhere else — but it leaves nobody able to volunteer to advertise the
// service. This is the door, with an admin on it.
//
// What comes out of an approval is deliberately NOT a normal account. A
// promoter was let in to bring people to the site, not to trade on it, so the
// account they get can share a code and collect earnings and nothing else. That
// is enforced in lib/deals.ts, not merely hidden in the UI — a server action is
// a public endpoint.
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { mintReferralCode } from "@/lib/referrals";
import type { CurrentUser } from "@/lib/dal";
import type { PaymentMethod, PromoterApplicationStatus } from "@/generated/prisma/client";

export type PromoterResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export type ApplicationInput = {
  displayName: string;
  email: string;
  password: string;
  channel: string;
  payoutMethod: PaymentMethod;
};

/**
 * Records an application.
 *
 * Upsert rather than create: somebody who applies twice — because they thought
 * the first one failed, or because they were rejected and have since built an
 * audience — should replace their entry rather than stack a second one behind
 * it. The unique index on email is what makes that possible.
 *
 * Deliberately says the same thing whether or not the address already has an
 * account. "That email is already registered" on a public form tells a stranger
 * which addresses have accounts here, and this is a service where being known
 * to trade game accounts is worth hiding.
 */
export async function submitApplication(
  input: ApplicationInput,
): Promise<PromoterResult> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const channel = input.channel.trim();

  if (!email || !displayName || !channel) {
    return { ok: false, error: "Fill in every field." };
  }

  // Somebody who already has an account does not need to apply — they already
  // have a code. Recorded as a no-op rather than an error, for the reason above.
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existing) return { ok: true };

  const passwordHash = await hashPassword(input.password);

  // A decided application is not reopened by re-applying: it goes back to
  // pending with the new details, so an admin sees the fresh case rather than
  // an old rejection.
  await prisma.promoterApplication.upsert({
    where: { email },
    update: {
      displayName,
      channel,
      passwordHash,
      payoutMethod: input.payoutMethod,
      status: "pending",
      reviewedById: null,
      reviewedAt: null,
      decisionNote: null,
    },
    create: { email, displayName, channel, passwordHash, payoutMethod: input.payoutMethod },
  });

  return { ok: true };
}

export type ApplicationRow = {
  id: string;
  displayName: string;
  email: string;
  channel: string;
  status: PromoterApplicationStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  decisionNote: string | null;
  payoutMethod: PaymentMethod | null;
  reviewedByName: string | null;
  /** The account this produced, once approved. */
  createdUserId: string | null;
};

export async function listApplications(onlyPending: boolean): Promise<ApplicationRow[]> {
  const rows = await prisma.promoterApplication.findMany({
    where: onlyPending ? { status: "pending" } : {},
    // Oldest first when working the queue: somebody who applied a week ago has
    // been waiting a week.
    orderBy: onlyPending ? { createdAt: "asc" } : { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      displayName: true,
      email: true,
      channel: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
      decisionNote: true,
      payoutMethod: true,
      createdUserId: true,
      reviewedBy: { select: { displayName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    channel: row.channel,
    status: row.status,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
    decisionNote: row.decisionNote,
    payoutMethod: row.payoutMethod,
    createdUserId: row.createdUserId,
    reviewedByName: row.reviewedBy?.displayName ?? null,
  }));
}

export function countPendingApplications(): Promise<number> {
  return prisma.promoterApplication.count({ where: { status: "pending" } });
}

/**
 * ADMIN. Lets them in, and mints the account.
 *
 * The new account has no `referredById`. Nobody introduced them — they came
 * through the front door — and inventing a promoter above them would pay
 * somebody $2 a deal for a recruit they never made.
 */
export async function approveApplication(
  admin: CurrentUser,
  applicationId: string,
  note: string,
): Promise<PromoterResult<{ userId: string }>> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const application = await prisma.promoterApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      email: true,
      displayName: true,
      passwordHash: true,
      status: true,
      payoutMethod: true,
    },
  });

  if (!application) return { ok: false, error: "That application no longer exists." };

  if (application.status !== "pending") {
    return { ok: false, error: "That application has already been decided." };
  }

  if (!application.passwordHash) {
    return {
      ok: false,
      error: "That application has no password on it — ask them to apply again.",
    };
  }

  // Between the check above and the write below, the address could have been
  // registered normally. The unique index on User.email is the real guard; this
  // turns it into a message rather than a crash.
  const taken = await prisma.user.findUnique({
    where: { email: application.email },
    select: { id: true },
  });

  if (taken) {
    return { ok: false, error: "Somebody has since registered with that address." };
  }

  const created = await prisma.user.create({
    data: {
      email: application.email,
      displayName: application.displayName,
      passwordHash: application.passwordHash,
      role: "promoter",
      referralCode: await mintReferralCode(),
      // Carried over so their first withdraw form is already on the method
      // they said they wanted, rather than asking the same question twice.
      preferredPayoutMethod: application.payoutMethod,
    },
    select: { id: true },
  });

  // Conditional on still being pending, so two admins clicking at once cannot
  // both approve and mint two accounts.
  const claimed = await prisma.promoterApplication.updateMany({
    where: { id: applicationId, status: "pending" },
    data: {
      status: "approved",
      createdUserId: created.id,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      decisionNote: note.trim() || null,
      // The account owns the hash now; a second copy on the application is a
      // second place it can leak from.
      passwordHash: null,
    },
  });

  if (claimed.count !== 1) {
    await prisma.user.delete({ where: { id: created.id } }).catch(() => {});

    return { ok: false, error: "That application was decided by someone else just now." };
  }

  return { ok: true, userId: created.id };
}

/** ADMIN. Refuses it, and drops the credentials that came with it. */
export async function rejectApplication(
  admin: CurrentUser,
  applicationId: string,
  reason: string,
): Promise<PromoterResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const trimmed = reason.trim();

  if (!trimmed) return { ok: false, error: "Give a reason — it is kept with the application." };

  const result = await prisma.promoterApplication.updateMany({
    where: { id: applicationId, status: "pending" },
    data: {
      status: "rejected",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      decisionNote: trimmed,
      // No account was created, so nothing needs this any more. Keeping a
      // password hash for somebody who was turned away is a liability with no
      // corresponding use.
      passwordHash: null,
    },
  });

  if (result.count !== 1) return { ok: false, error: "That application has already been decided." };

  return { ok: true };
}
