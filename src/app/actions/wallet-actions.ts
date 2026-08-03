"use server";

// Withdrawals, from both sides. Every one re-checks the caller through the DAL:
// a server action is a public endpoint, and the page having rendered proves
// nothing about who is calling it.
import { revalidatePath } from "next/cache";

import { requireAdmin, requireUser } from "@/lib/dal";
import {
  cancelWithdrawal,
  markWithdrawalSent,
  rejectWithdrawal,
  requestWithdrawal,
} from "@/lib/wallet";
import { withdrawalSchema } from "@/lib/validation";
import { fieldErrorsFrom, type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";

export async function requestWithdrawalAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const raw = {
    amountCents: String(formData.get("amount") ?? ""),
    method: String(formData.get("method") ?? ""),
    destination: String(formData.get("destination") ?? ""),
  };

  // The destination is echoed back on failure — it is long and awkward to
  // retype, and unlike a password there is nothing gained by clearing it.
  const echo = { amount: raw.amountCents, destination: raw.destination };

  const parsed = withdrawalSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: echo };
  }

  try {
    const result = await requestWithdrawal(user, parsed.data);

    if (!result.ok) return { message: result.error, values: echo };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: echo };
    throw error;
  }

  revalidatePath("/wallet");
  revalidatePath("/admin");
  revalidatePath("/admin/withdrawals");

  return {};
}

export async function cancelWithdrawalAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const id = String(formData.get("withdrawalId") ?? "");

  if (!id) return { message: "Missing withdrawal." };

  try {
    const result = await cancelWithdrawal(user, id);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/wallet");
  revalidatePath("/admin");
  revalidatePath("/admin/withdrawals");

  return {};
}

export async function markWithdrawalSentAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = String(formData.get("withdrawalId") ?? "");
  const reference = String(formData.get("reference") ?? "");

  if (!id) return { message: "Missing withdrawal." };

  try {
    const result = await markWithdrawalSent(admin, id, reference);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  revalidatePath("/wallet");

  return {};
}

export async function rejectWithdrawalAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = String(formData.get("withdrawalId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!id) return { message: "Missing withdrawal." };

  try {
    const result = await rejectWithdrawal(admin, id, reason);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  revalidatePath("/wallet");

  return {};
}
