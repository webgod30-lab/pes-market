"use server";

// Turning two-factor on and off. Every one of these re-checks who is signed in
// via the DAL — a server action is a public endpoint, and the page having
// rendered proves nothing about who is calling it.
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/dal";
import {
  beginTotpEnrolment,
  confirmTotpEnrolment,
  disableTotp,
} from "@/lib/totp";
import { type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";

export type EnrolmentState = FormState & {
  /** Set once, when enrolment starts, so the QR can be drawn. */
  setup?: { secret: string; uri: string };
  /** Shown exactly once, immediately after confirming. Never retrievable. */
  recoveryCodes?: string[];
};

export async function beginTotpAction(): Promise<EnrolmentState> {
  const user = await requireUser();

  try {
    const result = await beginTotpEnrolment(user.id, user.email);

    if (!result.ok) return { message: result.error };

    return { setup: { secret: result.secret, uri: result.uri } };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }
}

export async function confirmTotpAction(
  _previousState: EnrolmentState | undefined,
  formData: FormData,
): Promise<EnrolmentState> {
  const user = await requireUser();

  const token = String(formData.get("token") ?? "").trim();

  if (!token) return { fieldErrors: { token: "Enter the code from your app." } };

  try {
    const result = await confirmTotpEnrolment(user.id, token);

    if (!result.ok) return { message: result.error };

    // Deliberately NOT revalidating here. Doing so re-renders the page with
    // two-factor now on, which swaps the enrolment component out for the
    // "already on" one — and takes the recovery codes with it, before anyone
    // has read them. They exist only in this return value and are never
    // retrievable, so the refresh has to wait until the user says they have
    // saved them.
    return { recoveryCodes: result.recoveryCodes };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }
}

export async function disableTotpAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const password = String(formData.get("password") ?? "");

  if (!password) return { fieldErrors: { password: "Confirm your password." } };

  try {
    const result = await disableTotp(user.id, password);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/settings/security");

  return {};
}
