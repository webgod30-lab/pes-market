"use server";

// Buyer-side money actions: declaring payment, reading the released account,
// and confirming the claim.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/dal";
import { confirmClaimed, revealDeliveredCredentials, submitPayment } from "@/lib/deals";
import { describePaymentInstructions, findActivePaymentMethod } from "@/lib/payment-methods";
import { startAutomaticPayment } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { submitPaymentSchema } from "@/lib/validation";
import { fieldErrorsFrom, type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";
import type { CredentialData } from "@/lib/crypto";

/**
 * Starts an automatic payment: records a PaymentIntent and returns whatever the
 * provider wants the buyer to see. The deal does NOT advance here — only a
 * verified webhook moves it, which is the whole point.
 */
export async function startAutomaticPaymentAction(
  _previousState: { instructions?: string; redirectUrl?: string | null; error?: string } | undefined,
  formData: FormData,
): Promise<{ instructions?: string; redirectUrl?: string | null; error?: string }> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");

  if (!dealId || !paymentMethodId) return { error: "Missing deal or payment method." };

  try {
    const method = await findActivePaymentMethod(paymentMethodId);

    if (!method?.isAutomatic || !method.provider) {
      return { error: "That payment method is not an automatic one." };
    }

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        reference: true,
        agreedPriceCents: true,
        currency: true,
        buyerId: true,
        status: true,
      },
    });

    if (!deal) return { error: "Deal not found." };
    if (deal.buyerId !== user.id) return { error: "Only the buyer can pay for this deal." };
    if (deal.status !== "awaiting_payment") return { error: "This deal is not waiting for payment." };

    const result = await startAutomaticPayment(method.provider, deal);

    if (!result.ok) return { error: result.error };

    revalidatePath(`/deals/${dealId}`);

    return { instructions: result.instructions, redirectUrl: result.redirectUrl };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { error: dbProblem };
    throw error;
  }
}

export async function submitPaymentAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { message: "Missing deal." };

  const raw = {
    paymentMethodId: String(formData.get("paymentMethodId") ?? ""),
    txHash: String(formData.get("txHash") ?? ""),
    reference: String(formData.get("reference") ?? ""),
  };

  const parsed = submitPaymentSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: raw };
  }

  try {
    const method = await findActivePaymentMethod(parsed.data.paymentMethodId);

    if (!method) {
      return { message: "That payment method is no longer available.", values: raw };
    }

    // Re-read the amount from the deal rather than trusting anything posted.
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { agreedPriceCents: true, currency: true },
    });

    if (!deal) return { message: "Deal not found." };

    const result = await submitPayment(user, dealId, {
      method: method.method,
      txHash: parsed.data.txHash,
      reference: parsed.data.reference,
      instructionsSnapshot: describePaymentInstructions(
        method,
        deal.agreedPriceCents,
        deal.currency,
      ),
    });

    if (!result.ok) return { message: result.error, values: raw };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: raw };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/admin");
  redirect(`/deals/${dealId}?paid=1`);
}

/** Returns the credentials to the buyer's screen. Never persisted, never logged. */
export async function revealForBuyerAction(
  _previousState: { credentials?: CredentialData; error?: string } | undefined,
  formData: FormData,
): Promise<{ credentials?: CredentialData; error?: string }> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { error: "Missing deal." };

  try {
    const result = await revealDeliveredCredentials(user, dealId);

    if (!result.ok) return { error: result.error };

    revalidatePath(`/deals/${dealId}`);
    return { credentials: result.credentials };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { error: dbProblem };
    throw error;
  }
}

export async function confirmClaimedAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { message: "Missing deal." };

  try {
    const result = await confirmClaimed(user, dealId);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/admin");
  redirect(`/deals/${dealId}?confirmed=1`);
}
