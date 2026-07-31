// Per-deal chat. SERVER ONLY.
//
// Three people can be in a deal's conversation: the seller, the buyer and the
// admin. The admin can also leave internal notes, which the two parties never
// see — those are the admin's working record for a dispute.
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/dal";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: Date;
  isAdminNote: boolean;
  sender: { id: string; displayName: string; role: string };
  /** True when the signed-in reader wrote it. */
  mine: boolean;
};

/** Seller, buyer, or admin. Anyone else has no business here. */
async function participantRole(
  dealId: string,
  user: CurrentUser,
): Promise<"seller" | "buyer" | "admin" | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { sellerId: true, buyerId: true },
  });

  if (!deal) return null;

  if (deal.sellerId === user.id) return "seller";
  if (deal.buyerId === user.id) return "buyer";
  if (user.role === "admin") return "admin";

  return null;
}

/**
 * Messages for a deal, filtered for who is asking.
 *
 * Non-admins never receive admin notes — they are excluded in the query rather
 * than hidden in the UI, so they cannot leak through a page payload.
 */
export async function listMessages(
  dealId: string,
  user: CurrentUser,
): Promise<ChatMessage[] | null> {
  const role = await participantRole(dealId, user);

  if (!role) return null;

  const rows = await prisma.message.findMany({
    where: {
      dealId,
      ...(role === "admin" ? {} : { isAdminNote: false }),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      isAdminNote: true,
      sender: { select: { id: true, displayName: true, role: true } },
    },
  });

  return rows.map((row) => ({ ...row, mine: row.sender.id === user.id }));
}

export type PostMessageResult = { ok: true } | { ok: false; error: string };

export async function postMessage(
  user: CurrentUser,
  dealId: string,
  body: string,
  asAdminNote = false,
): Promise<PostMessageResult> {
  const role = await participantRole(dealId, user);

  if (!role) return { ok: false, error: "You are not part of this deal." };

  // Only the admin can write something the other two cannot see.
  if (asAdminNote && role !== "admin") {
    return { ok: false, error: "Only the admin can leave internal notes." };
  }

  const trimmed = body.trim();

  if (!trimmed) return { ok: false, error: "Write something first." };
  if (trimmed.length > 4000) return { ok: false, error: "Message is too long (4000 characters max)." };

  await prisma.message.create({
    data: { dealId, senderId: user.id, body: trimmed, isAdminNote: asAdminNote },
  });

  return { ok: true };
}

/** Count of messages the reader has not seen, for a nudge on the deal list. */
export async function unreadCountForUser(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      isAdminNote: false,
      senderId: { not: userId },
      readAt: null,
      deal: { OR: [{ sellerId: userId }, { buyerId: userId }] },
    },
  });
}

/** Marks everything the reader can see on this deal as read. */
export async function markMessagesRead(dealId: string, user: CurrentUser): Promise<void> {
  const role = await participantRole(dealId, user);

  if (!role) return;

  await prisma.message.updateMany({
    where: { dealId, senderId: { not: user.id }, readAt: null, isAdminNote: false },
    data: { readAt: new Date() },
  });
}
