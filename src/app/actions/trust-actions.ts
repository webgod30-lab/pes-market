"use server";

// Chat, reviews and disputes.
//
// As everywhere else: these are public endpoints, so each one re-checks who the
// caller is and hands off to the domain layer for the actual rules.
import { revalidatePath } from "next/cache";

import { requireAdmin, requireUser } from "@/lib/dal";
import { markMessagesRead, postMessage } from "@/lib/messages";
import { leaveReview } from "@/lib/reviews";
import { openDispute, resolveDispute, withdrawDispute } from "@/lib/disputes";
import { fieldErrorsFrom, type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";
import { disputeSchema, resolveDisputeSchema, reviewSchema } from "@/lib/validation";

export async function postMessageAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  const body = String(formData.get("body") ?? "");
  // Only meaningful for an admin; postMessage() rejects it for anyone else.
  const asAdminNote = formData.get("isAdminNote") === "on";

  if (!dealId) return { message: "Missing deal." };

  try {
    const result = await postMessage(user, dealId, body, asAdminNote);

    if (!result.ok) return { message: result.error, values: { body } };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: { body } };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/admin/deals/${dealId}`);

  return {};
}

/**
 * Clears the unread badge once someone actually opens the conversation.
 *
 * Called from the chat component rather than during page render: marking things
 * read is a write, and a GET request should not have side effects.
 */
export async function markMessagesReadAction(dealId: string): Promise<void> {
  const user = await requireUser();

  try {
    await markMessagesRead(dealId, user);
  } catch {
    // A failed read-receipt is not worth breaking the page over.
    return;
  }

  revalidatePath("/dashboard");
}

export async function leaveReviewAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { message: "Missing deal." };

  const parsed = reviewSchema.safeParse({
    rating: String(formData.get("rating") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    const result = await leaveReview(user, dealId, parsed.data.rating, parsed.data.comment);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);

  return {};
}

export async function openDisputeAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { message: "Missing deal." };

  const raw = {
    reason: String(formData.get("reason") ?? ""),
    description: String(formData.get("description") ?? ""),
  };

  const parsed = disputeSchema.safeParse(raw);

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: raw };

  try {
    const result = await openDispute(user, dealId, parsed.data.reason, parsed.data.description);

    if (!result.ok) return { message: result.error, values: raw };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: raw };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/admin");

  return {};
}

export async function withdrawDisputeAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { message: "Missing deal." };

  try {
    const result = await withdrawDispute(user, dealId);

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

export async function resolveDisputeAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const dealId = String(formData.get("dealId") ?? "");
  if (!dealId) return { message: "Missing deal." };

  const parsed = resolveDisputeSchema.safeParse({
    outcome: String(formData.get("outcome") ?? ""),
    resolution: String(formData.get("resolution") ?? ""),
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    const result = await resolveDispute(
      admin,
      dealId,
      parsed.data.outcome,
      parsed.data.resolution,
    );

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
