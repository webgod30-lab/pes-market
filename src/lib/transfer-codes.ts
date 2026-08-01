// The publisher verification code exchange. SERVER ONLY.
//
// Handing over the login is not the end of a transfer. Changing the email on an
// eFootball account makes Konami send a verification code to the address on
// file — which is still the seller's. Without it the buyer cannot finish taking
// ownership, so the deal stalls at exactly the moment the buyer has paid and
// has nothing.
//
// This models it as a request the buyer raises and the seller answers, because
// that is what actually happens, and because it puts a timestamp on who is
// holding things up.
import { prisma } from "@/lib/prisma";
import { decryptString, encryptString } from "@/lib/crypto";
import type { CurrentUser } from "@/lib/dal";
import type { DealStatus } from "@/generated/prisma/client";

export type CodeResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Stages where a code exchange makes sense: the buyer has the credentials and
 * is mid-transfer. Before release there is nothing to verify; once the deal is
 * settled or refunded the exchange is over.
 */
export const CODE_EXCHANGE_STATUSES: DealStatus[] = [
  "credentials_released",
  "claiming",
  "disputed",
];

export type TransferCodeView = {
  id: string;
  requestNote: string | null;
  requestedAt: Date;
  requestedByName: string;
  /** Null while the seller has not answered yet. */
  code: string | null;
  providedAt: Date | null;
  providedByName: string | null;
};

type Party = { role: "seller" | "buyer" | "admin"; deal: { id: string; status: DealStatus } };

/** Seller, buyer or admin on this deal — anyone else gets nothing. */
async function partyFor(dealId: string, user: CurrentUser): Promise<Party | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, status: true, sellerId: true, buyerId: true },
  });

  if (!deal) return null;

  const role =
    deal.sellerId === user.id
      ? "seller"
      : deal.buyerId === user.id
        ? "buyer"
        : user.role === "admin"
          ? "admin"
          : null;

  if (!role) return null;

  return { role, deal: { id: deal.id, status: deal.status } };
}

/**
 * The exchange for one deal.
 *
 * Codes are decrypted here because everyone who can see this list — the two
 * parties and the admin — is entitled to the code. A stranger never gets this
 * far: partyFor() returns null and the caller gets nothing.
 */
export async function listTransferCodes(
  dealId: string,
  user: CurrentUser,
): Promise<TransferCodeView[] | null> {
  const party = await partyFor(dealId, user);

  if (!party) return null;

  const rows = await prisma.transferCode.findMany({
    where: { dealId },
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      requestNote: true,
      requestedAt: true,
      ciphertext: true,
      providedAt: true,
      requestedBy: { select: { displayName: true } },
      providedBy: { select: { displayName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    requestNote: row.requestNote,
    requestedAt: row.requestedAt,
    requestedByName: row.requestedBy.displayName,
    code: row.ciphertext ? decryptString(row.ciphertext) : null,
    providedAt: row.providedAt,
    providedByName: row.providedBy?.displayName ?? null,
  }));
}

/**
 * The buyer says they are stuck waiting on a code.
 *
 * Only the buyer raises these: the seller asking themselves for a code would be
 * meaningless, and letting anyone else do it would let a stranger spam the
 * seller's deal.
 */
export async function requestTransferCode(
  user: CurrentUser,
  dealId: string,
  note: string,
): Promise<CodeResult> {
  const party = await partyFor(dealId, user);

  if (!party) return { ok: false, error: "You are not part of this deal." };

  if (party.role !== "buyer") {
    return { ok: false, error: "Only the buyer can ask for a transfer code." };
  }

  if (!CODE_EXCHANGE_STATUSES.includes(party.deal.status)) {
    return {
      ok: false,
      error: "Transfer codes only apply once the account has been released to you.",
    };
  }

  // One open request at a time. Otherwise a buyer refreshing the page leaves the
  // seller with a queue of identical asks and no idea which to answer.
  const open = await prisma.transferCode.findFirst({
    where: { dealId, providedAt: null },
    select: { id: true },
  });

  if (open) {
    return { ok: false, error: "You already have a code request waiting on the seller." };
  }

  await prisma.transferCode.create({
    data: {
      dealId,
      requestedById: user.id,
      requestNote: note.trim() || null,
    },
  });

  return { ok: true };
}

/**
 * The seller supplies the code Konami sent them.
 *
 * Restricted to the seller because it is their inbox the code arrives in. The
 * admin cannot do it on their behalf — if the admin could invent a code the
 * whole point of the seller staying reachable would collapse.
 */
export async function provideTransferCode(
  user: CurrentUser,
  requestId: string,
  code: string,
): Promise<CodeResult> {
  const trimmed = code.trim();

  if (!trimmed) return { ok: false, error: "Enter the code Konami sent you." };
  if (trimmed.length > 64) return { ok: false, error: "That does not look like a verification code." };

  const request = await prisma.transferCode.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      providedAt: true,
      deal: { select: { id: true, sellerId: true, status: true } },
    },
  });

  if (!request) return { ok: false, error: "That request no longer exists." };

  if (request.deal.sellerId !== user.id) {
    return { ok: false, error: "Only the seller can supply the transfer code." };
  }

  if (request.providedAt) {
    return { ok: false, error: "You have already answered this request." };
  }

  if (!CODE_EXCHANGE_STATUSES.includes(request.deal.status)) {
    return { ok: false, error: "This deal is no longer at the transfer stage." };
  }

  // Conditional update: two submissions racing cannot both write a code.
  const result = await prisma.transferCode.updateMany({
    where: { id: requestId, providedAt: null },
    data: {
      ciphertext: encryptString(trimmed),
      providedById: user.id,
      providedAt: new Date(),
    },
  });

  if (result.count !== 1) return { ok: false, error: "That request was just answered." };

  return { ok: true };
}

/** Requests still sitting unanswered — the usual reason a claim stalls. */
export function countUnansweredCodeRequests(): Promise<number> {
  return prisma.transferCode.count({
    where: {
      providedAt: null,
      deal: { status: { in: CODE_EXCHANGE_STATUSES } },
    },
  });
}

/** Deals where the seller has gone quiet on a code request, for the admin queue. */
export function listStalledCodeRequests() {
  return prisma.transferCode.findMany({
    where: { providedAt: null, deal: { status: { in: CODE_EXCHANGE_STATUSES } } },
    orderBy: { requestedAt: "asc" },
    take: 50,
    select: {
      id: true,
      requestedAt: true,
      requestNote: true,
      deal: {
        select: {
          id: true,
          reference: true,
          seller: { select: { displayName: true } },
          buyer: { select: { displayName: true } },
        },
      },
    },
  });
}
