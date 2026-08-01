"use server";

// The buyer asks for the publisher's verification code; the seller supplies it.
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/dal";
import { provideTransferCode, requestTransferCode } from "@/lib/transfer-codes";
import { provideTransferCodeSchema, requestTransferCodeSchema } from "@/lib/validation";
import { fieldErrorsFrom, type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";

export async function requestTransferCodeAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { message: "Missing deal." };

  const parsed = requestTransferCodeSchema.safeParse({ note: String(formData.get("note") ?? "") });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    const result = await requestTransferCode(user, dealId, parsed.data.note);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/admin/deals/${dealId}`);
  revalidatePath("/admin");

  return {};
}

export async function provideTransferCodeAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");

  const parsed = provideTransferCodeSchema.safeParse({
    requestId: String(formData.get("requestId") ?? ""),
    code: String(formData.get("code") ?? ""),
  });

  // No `values` echo: the code is a live credential and is not re-rendered into
  // the response on a validation failure.
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    const result = await provideTransferCode(user, parsed.data.requestId, parsed.data.code);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/admin/deals/${dealId}`);
  revalidatePath("/admin");

  return {};
}
