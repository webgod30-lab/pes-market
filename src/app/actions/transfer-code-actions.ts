"use server";

// The buyer asks for the publisher's verification code; the seller supplies it.
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/dal";
import { provideTransferCode, requestTransferCode, sendTransferCode } from "@/lib/transfer-codes";
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

/**
 * The seller hands over a code — either answering an open request, or pushing
 * one across unasked.
 *
 * One action for both because it is one thing from the seller's side: they have
 * a code and they are sending it. Which of the two it turns out to be depends
 * on whether the buyer happened to press the button first, and making the
 * seller care about that distinction is how the code ends up not being sent.
 */
export async function provideTransferCodeAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");

  const parsed = provideTransferCodeSchema.safeParse({
    // Unprompted sends carry no request to answer; the schema still checks the
    // code itself, which is the part that matters.
    requestId: requestId || "unprompted",
    code: String(formData.get("code") ?? ""),
  });

  // No `values` echo: the code is a live credential and is not re-rendered into
  // the response on a validation failure.
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  if (!dealId) return { message: "Missing deal." };

  try {
    const result = requestId
      ? await provideTransferCode(user, requestId, parsed.data.code)
      : await sendTransferCode(user, dealId, parsed.data.code);

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
