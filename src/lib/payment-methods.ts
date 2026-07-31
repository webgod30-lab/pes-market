// The manual payment methods the admin offers. SERVER ONLY.
//
// There is no payment gateway in this build. These rows are purely the
// instructions a buyer is shown — a wallet address and network for crypto, or
// whatever manual arrangement the admin uses otherwise. Money moves outside the
// app; the admin confirms it arrived.
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { getProvider } from "@/lib/payments";
import type { CurrentUser } from "@/lib/dal";
import type { PaymentMethod } from "@/generated/prisma/client";

export type PaymentMethodView = {
  id: string;
  method: PaymentMethod;
  label: string;
  isActive: boolean;
  sortOrder: number;
  instructions: string;
  walletAddress: string | null;
  network: string | null;
  /** Confirmed by a provider webhook rather than by the admin's eyes. */
  isAutomatic: boolean;
  provider: string | null;
};

const PAYMENT_METHOD_FIELDS = {
  id: true,
  method: true,
  label: true,
  isActive: true,
  sortOrder: true,
  instructions: true,
  walletAddress: true,
  network: true,
  isAutomatic: true,
  provider: true,
} as const;

/** What a buyer can choose from. */
export function listActivePaymentMethods(): Promise<PaymentMethodView[]> {
  return prisma.paymentMethodConfig.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: PAYMENT_METHOD_FIELDS,
  });
}

/** Everything, including deactivated methods, for the admin settings screen. */
export function listAllPaymentMethods(): Promise<PaymentMethodView[]> {
  return prisma.paymentMethodConfig.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: PAYMENT_METHOD_FIELDS,
  });
}

export function findActivePaymentMethod(id: string): Promise<PaymentMethodView | null> {
  return prisma.paymentMethodConfig.findFirst({
    where: { id, isActive: true },
    select: PAYMENT_METHOD_FIELDS,
  });
}

/**
 * A plain-text record of exactly what the buyer was told to do, stored on the
 * deal when they submit payment. If the wallet address is edited later, this is
 * what a dispute is judged against.
 */
export function describePaymentInstructions(
  method: PaymentMethodView,
  amountCents: number,
  currency: string,
): string {
  const lines = [
    `Method: ${method.label}`,
    `Amount: ${formatCents(amountCents, currency)}`,
  ];

  if (method.network) lines.push(`Network: ${method.network}`);
  if (method.walletAddress) lines.push(`Address: ${method.walletAddress}`);

  lines.push(`Instructions: ${method.instructions}`);

  return lines.join("\n");
}

export type UpsertPaymentMethodInput = {
  id?: string;
  method: PaymentMethod;
  label: string;
  isActive: boolean;
  sortOrder: number;
  instructions: string;
  walletAddress: string | null;
  network: string | null;
  isAutomatic: boolean;
  provider: string | null;
};

/** ADMIN. Create or update a payment method. */
export async function upsertPaymentMethod(
  admin: CurrentUser,
  input: UpsertPaymentMethodInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  // "Automatic" without a working adapter would leave buyers with a payment
  // nothing can confirm, so it is refused rather than quietly downgraded.
  if (input.isAutomatic && !getProvider(input.provider)) {
    return {
      ok: false,
      error: "Choose a payment provider before marking this method automatic.",
    };
  }

  const data = {
    method: input.method,
    label: input.label,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
    instructions: input.instructions,
    isAutomatic: input.isAutomatic,
    provider: input.isAutomatic ? input.provider : null,
    // Only meaningful for crypto; blank them out otherwise so a stale address
    // cannot show under a bank transfer.
    walletAddress: input.method === "crypto" ? input.walletAddress : null,
    network: input.method === "crypto" ? input.network : null,
  };

  const row = input.id
    ? await prisma.paymentMethodConfig.update({
        where: { id: input.id },
        data,
        select: { id: true },
      })
    : await prisma.paymentMethodConfig.create({ data, select: { id: true } });

  return { ok: true, id: row.id };
}

/**
 * ADMIN. Deactivating rather than deleting keeps old deals readable — a deal
 * that quoted "USDT (TRC-20)" should still make sense a year later.
 */
export async function setPaymentMethodActive(
  admin: CurrentUser,
  id: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (admin.role !== "admin") return { ok: false, error: "Admins only." };

  await prisma.paymentMethodConfig.update({ where: { id }, data: { isActive } });

  return { ok: true };
}
