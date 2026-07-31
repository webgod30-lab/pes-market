"use server";

// Admin actions. Every one re-checks the admin role through requireAdmin() and
// again inside the domain function — a server action is a public endpoint, and
// these are the actions that move money and release accounts.
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/dal";
import {
  approveDelivery,
  confirmPaymentReceived,
  markPayoutSent,
  recordVerification,
  refundDeal,
  revealCredentialsToAdmin,
} from "@/lib/deals";
import { setPaymentMethodActive, upsertPaymentMethod } from "@/lib/payment-methods";
import { banUser, forceCancel, forceRefundCompleted, unbanUser } from "@/lib/admin";
import {
  banUserSchema,
  paymentMethodSchema,
  payoutSchema,
  verificationNoteSchema,
} from "@/lib/validation";
import { fieldErrorsFrom, type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";
import type { CredentialData } from "@/lib/crypto";

/** Wraps the boilerplate: admin check, db-error translation, revalidation. */
async function adminAction(
  dealId: string,
  run: (admin: Awaited<ReturnType<typeof requireAdmin>>) => Promise<{ ok: boolean; error?: string }>,
): Promise<FormState> {
  const admin = await requireAdmin();

  if (!dealId) return { message: "Missing deal." };

  try {
    const result = await run(admin);

    if (!result.ok) return { message: result.error ?? "That action was refused." };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath(`/admin/deals/${dealId}`);
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/admin");

  return { message: undefined };
}

export async function confirmPaymentAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const dealId = String(formData.get("dealId") ?? "");
  return adminAction(dealId, (admin) => confirmPaymentReceived(admin, dealId));
}

export async function approveDeliveryAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const dealId = String(formData.get("dealId") ?? "");
  return adminAction(dealId, (admin) => approveDelivery(admin, dealId));
}

export async function refundDealAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const dealId = String(formData.get("dealId") ?? "");
  return adminAction(dealId, (admin) => refundDeal(admin, dealId));
}

export async function recordVerificationAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const dealId = String(formData.get("dealId") ?? "");
  const parsed = verificationNoteSchema.safeParse({ note: String(formData.get("note") ?? "") });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  return adminAction(dealId, (admin) => recordVerification(admin, dealId, parsed.data.note));
}

export async function markPayoutAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const dealId = String(formData.get("dealId") ?? "");
  const parsed = payoutSchema.safeParse({ reference: String(formData.get("reference") ?? "") });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  return adminAction(dealId, (admin) => markPayoutSent(admin, dealId, parsed.data.reference));
}

/**
 * Decrypts the account so the admin can check it before approving delivery.
 * The result goes to the admin's screen and nowhere else.
 */
export async function revealForAdminAction(
  _previousState: { credentials?: CredentialData; error?: string } | undefined,
  formData: FormData,
): Promise<{ credentials?: CredentialData; error?: string }> {
  const admin = await requireAdmin();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { error: "Missing deal." };

  try {
    const result = await revealCredentialsToAdmin(admin, dealId);

    if (!result.ok) return { error: result.error };

    return { credentials: result.credentials };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { error: dbProblem };
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Force actions — the escape hatches
// ---------------------------------------------------------------------------

export async function forceRefundAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const dealId = String(formData.get("dealId") ?? "");
  return adminAction(dealId, (admin) => forceRefundCompleted(admin, dealId));
}

export async function forceCancelAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const dealId = String(formData.get("dealId") ?? "");
  return adminAction(dealId, (admin) => forceCancel(admin, dealId));
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function banUserAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const raw = {
    userId: String(formData.get("userId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  };

  const parsed = banUserSchema.safeParse(raw);

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: raw };

  try {
    const result = await banUser(admin, parsed.data.userId, parsed.data.reason);

    if (!result.ok) return { message: result.error, values: raw };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: raw };
    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");

  return {};
}

export async function unbanUserAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");

  if (!userId) return { message: "Missing user." };

  try {
    const result = await unbanUser(admin, userId);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");

  return {};
}

// ---------------------------------------------------------------------------
// Payment method settings
// ---------------------------------------------------------------------------

export async function savePaymentMethodAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const raw = {
    id: String(formData.get("id") ?? ""),
    method: String(formData.get("method") ?? ""),
    label: String(formData.get("label") ?? ""),
    isActive: formData.get("isActive") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    instructions: String(formData.get("instructions") ?? ""),
    walletAddress: String(formData.get("walletAddress") ?? ""),
    network: String(formData.get("network") ?? ""),
    isAutomatic: formData.get("isAutomatic") === "on",
    provider: String(formData.get("provider") ?? ""),
  };

  const parsed = paymentMethodSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)])),
    };
  }

  try {
    const result = await upsertPaymentMethod(admin, {
      id: parsed.data.id ?? undefined,
      method: parsed.data.method,
      label: parsed.data.label,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
      instructions: parsed.data.instructions,
      walletAddress: parsed.data.walletAddress,
      network: parsed.data.network,
      isAutomatic: parsed.data.isAutomatic,
      provider: parsed.data.provider,
    });

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/admin/payment-methods");

  return { message: undefined };
}

export async function togglePaymentMethodAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id) return { message: "Missing method." };

  try {
    const result = await setPaymentMethodActive(admin, id, isActive);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/admin/payment-methods");

  return { message: undefined };
}
