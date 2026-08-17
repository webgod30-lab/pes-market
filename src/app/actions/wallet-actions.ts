"use server";

// Withdrawals, from both sides. Every one re-checks the caller through the DAL:
// a server action is a public endpoint, and the page having rendered proves
// nothing about who is calling it.
import { revalidatePath } from "next/cache";

import { requireAdmin, requireUser } from "@/lib/dal";
import {
  cancelWithdrawal,
  confirmTestTransfer,
  markWithdrawalSent,
  recordTestTransfer,
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

  const field = (name: string) => String(formData.get(name) ?? "");

  const raw = {
    amountCents: field("amount"),
    method: field("method"),
    destinationName: field("destinationName"),
    destinationAccount: field("destinationAccount"),
    destinationNetwork: field("destinationNetwork"),
    destinationBank: field("destinationBank"),
    destinationBic: field("destinationBic"),
    destinationProvider: field("destinationProvider"),
  };

  // Everything is echoed back on failure. These are long, awkward to retype and
  // easy to mistype — and unlike a password there is nothing gained by
  // clearing them.
  const echo = {
    amount: raw.amountCents,
    destinationName: raw.destinationName,
    destinationAccount: raw.destinationAccount,
    destinationNetwork: raw.destinationNetwork,
    destinationBank: raw.destinationBank,
    destinationBic: raw.destinationBic,
    destinationProvider: raw.destinationProvider,
  };

  // The schema is discriminated on method, so it only ever reads the fields
  // that method uses; the rest are dropped rather than stored empty.
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

/**
 * ADMIN. Records the nominal test transfer on a first payout.
 *
 * The balance does not follow until the promoter says the test landed. A
 * crypto transfer to a mistyped address cannot be undone, and the person who
 * typed it will not accept that it was their mistake.
 */
export async function recordTestTransferAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const id = String(formData.get("withdrawalId") ?? "");
  const reference = String(formData.get("reference") ?? "");

  if (!id) return { message: "Missing withdrawal." };

  try {
    const result = await recordTestTransfer(admin, id, reference);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/admin/withdrawals");
  revalidatePath("/wallet");

  return {};
}

/** The promoter confirms the test arrived. Only they can. */
export async function confirmTestTransferAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/wallet");

  const id = String(formData.get("withdrawalId") ?? "");

  if (!id) return { message: "Missing withdrawal." };

  try {
    const result = await confirmTestTransfer(user, id);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/wallet");
  revalidatePath("/admin/withdrawals");

  return { success: "Thanks — the rest will go out in the next batch." };
}
