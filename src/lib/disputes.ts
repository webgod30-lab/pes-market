// Disputes. SERVER ONLY.
//
// A dispute is the emergency brake: it freezes the deal so neither the money nor
// the account can move, and hands the decision to the admin. Everything about
// the deal is already recorded — the frozen payment instructions, the delivered
// ciphertext snapshot, the verification note, the chat — so the admin is
// arbitrating from evidence rather than from whoever shouts loudest.
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/dal";
import type { DealStatus, DisputeStatus } from "@/generated/prisma/client";

export type DisputeResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Stages where a dispute makes sense: money is involved but the deal has not
 * settled. Before payment there is nothing to argue about — cancel instead.
 */
export const DISPUTABLE_STATUSES: DealStatus[] = [
  "payment_submitted",
  "admin_verifying",
  "credentials_released",
  "claiming",
];

export type DisputeView = {
  id: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  createdAt: Date;
  resolution: string | null;
  resolvedAt: Date | null;
  openedBy: { id: string; displayName: string };
  resolvedBy: { displayName: string } | null;
};

/** Statuses that mean a case is still live. */
const LIVE_DISPUTE: DisputeStatus[] = ["open", "under_review"];

/** The most recent case on a deal. Older ones are kept but not shown inline. */
export function getDisputeForDeal(dealId: string): Promise<DisputeView | null> {
  return prisma.dispute.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reason: true,
      description: true,
      status: true,
      createdAt: true,
      resolution: true,
      resolvedAt: true,
      openedBy: { select: { id: true, displayName: true } },
      resolvedBy: { select: { displayName: true } },
    },
  });
}

/** Either party can pull the brake. */
export async function openDispute(
  user: CurrentUser,
  dealId: string,
  reason: string,
  description: string,
): Promise<DisputeResult> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, sellerId: true, buyerId: true, status: true },
  });

  if (!deal) return { ok: false, error: "Deal not found." };

  if (deal.sellerId !== user.id && deal.buyerId !== user.id) {
    return { ok: false, error: "Only the two people in this deal can dispute it." };
  }

  if (!DISPUTABLE_STATUSES.includes(deal.status)) {
    return {
      ok: false,
      error:
        deal.status === "completed"
          ? "This deal is already settled. Contact the admin directly."
          : "There is nothing to dispute yet — cancel the deal instead.",
    };
  }

  const trimmedReason = reason.trim();
  const trimmedDescription = description.trim();

  if (!trimmedReason) return { ok: false, error: "Give a short reason." };
  if (!trimmedDescription) return { ok: false, error: "Explain what went wrong." };

  // One live case at a time. Earlier withdrawn or resolved cases stay on record.
  const existing = await prisma.dispute.findFirst({
    where: { dealId, status: { in: LIVE_DISPUTE } },
    select: { id: true },
  });

  if (existing) return { ok: false, error: "This deal already has an open dispute." };

  // Freezing and opening the case must happen together — a frozen deal with no
  // case would strand both parties.
  await prisma.$transaction([
    prisma.dispute.create({
      data: {
        dealId,
        openedById: user.id,
        reason: trimmedReason,
        description: trimmedDescription,
      },
    }),
    prisma.deal.updateMany({
      where: { id: dealId, status: { in: DISPUTABLE_STATUSES } },
      data: {
        // Remembered so withdrawing puts the deal back where it was.
        preDisputeStatus: deal.status,
        status: "disputed",
      },
    }),
  ]);

  return { ok: true };
}

/**
 * ADMIN. Decide it.
 *
 * "buyer" refunds and ends the deal; "seller" settles it as completed so the
 * payout can be recorded. Either way the deal leaves the frozen state.
 */
export async function resolveDispute(
  admin: CurrentUser,
  dealId: string,
  outcome: "buyer" | "seller",
  resolution: string,
): Promise<DisputeResult> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  const trimmed = resolution.trim();

  if (!trimmed) return { ok: false, error: "Write how you decided it." };

  const dispute = await prisma.dispute.findFirst({
    where: { dealId, status: { in: LIVE_DISPUTE } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!dispute) return { ok: false, error: "There is no open dispute on this deal." };

  const now = new Date();

  await prisma.$transaction([
    prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: outcome === "buyer" ? "resolved_buyer" : "resolved_seller",
        resolution: trimmed,
        resolvedById: admin.id,
        resolvedAt: now,
      },
    }),
    prisma.deal.updateMany({
      where: { id: dealId, status: "disputed" },
      data:
        outcome === "buyer"
          ? { status: "refunded", refundedAt: now, preDisputeStatus: null }
          : { status: "completed", completedAt: now, preDisputeStatus: null },
    }),
  ]);

  return { ok: true };
}

/** The person who opened it changed their mind; put the deal back. */
export async function withdrawDispute(user: CurrentUser, dealId: string): Promise<DisputeResult> {
  const dispute = await prisma.dispute.findFirst({
    where: { dealId, status: { in: LIVE_DISPUTE } },
    orderBy: { createdAt: "desc" },
    select: { id: true, openedById: true },
  });

  if (!dispute) return { ok: false, error: "There is no open dispute on this deal." };

  // The admin can also close a case that was opened by mistake.
  if (dispute.openedById !== user.id && user.role !== "admin") {
    return { ok: false, error: "Only the person who opened this dispute can withdraw it." };
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { preDisputeStatus: true },
  });

  // Fall back to the stage a disputed deal is most likely to resume at.
  const restoreTo: DealStatus = deal?.preDisputeStatus ?? "claiming";

  await prisma.$transaction([
    prisma.dispute.update({
      where: { id: dispute.id },
      data: { status: "cancelled", resolvedAt: new Date() },
    }),
    prisma.deal.updateMany({
      where: { id: dealId, status: "disputed" },
      data: { status: restoreTo, preDisputeStatus: null },
    }),
  ]);

  return { ok: true };
}

/** Open cases, oldest first — the admin's queue. */
export function listOpenDisputes() {
  return prisma.dispute.findMany({
    where: { status: { in: ["open", "under_review"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      reason: true,
      createdAt: true,
      openedBy: { select: { displayName: true } },
      deal: {
        select: {
          id: true,
          reference: true,
          agreedPriceCents: true,
          currency: true,
          seller: { select: { displayName: true } },
          buyer: { select: { displayName: true } },
        },
      },
    },
  });
}
