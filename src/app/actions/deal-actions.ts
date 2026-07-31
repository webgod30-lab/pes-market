"use server";

// Server actions for the deal lifecycle.
//
// These are thin: authenticate, validate, hand off to src/lib/deals.ts, then
// translate the result into something the form can render. All the rules that
// matter live in the domain layer.
//
// Every action re-checks who you are with requireUser(). A server action is a
// public HTTP endpoint — anyone can POST to it, so never trust an id in the
// form body to imply permission.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/dal";
import { cancelDeal, createDeal, depositCredentials, joinDealByCode } from "@/lib/deals";
import { createDealSchema, depositCredentialsSchema, joinDealSchema } from "@/lib/validation";
import { fieldErrorsFrom, type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";

export async function createDealAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/deals/new");

  const raw = {
    side: String(formData.get("side") ?? ""),
    accountSummary: String(formData.get("accountSummary") ?? ""),
    game: String(formData.get("game") ?? ""),
    platform: String(formData.get("platform") ?? ""),
    level: String(formData.get("level") ?? ""),
    agreedPriceCents: String(formData.get("agreedPriceCents") ?? ""),
  };

  const echo = { ...raw };

  const parsed = createDealSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: echo };
  }

  let dealId: string;

  try {
    const result = await createDeal({
      creator: user,
      side: parsed.data.side,
      accountSummary: parsed.data.accountSummary,
      game: parsed.data.game,
      platform: parsed.data.platform,
      level: parsed.data.level,
      agreedPriceCents: parsed.data.agreedPriceCents,
    });

    if (!result.ok) return { message: result.error, values: echo };

    dealId = result.dealId;
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: echo };
    throw error;
  }

  revalidatePath("/dashboard");
  // Outside the try: redirect() works by throwing.
  redirect(`/deals/${dealId}?created=1`);
}

export async function joinDealAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/deals/join");

  const raw = { inviteCode: String(formData.get("inviteCode") ?? "") };
  const parsed = joinDealSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: raw };
  }

  let dealId: string;

  try {
    const result = await joinDealByCode(user, parsed.data.inviteCode);

    if (!result.ok) return { message: result.error, values: raw };

    dealId = result.dealId;
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: raw };
    throw error;
  }

  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}?joined=1`);
}

export async function depositCredentialsAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");

  if (!dealId) return { message: "Missing deal." };

  const raw = {
    loginEmail: String(formData.get("loginEmail") ?? ""),
    loginPassword: String(formData.get("loginPassword") ?? ""),
    recoveryEmail: String(formData.get("recoveryEmail") ?? ""),
    recoveryEmailPassword: String(formData.get("recoveryEmailPassword") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = depositCredentialsSchema.safeParse(raw);

  if (!parsed.success) {
    // Note: no `values` echo. These are account credentials — they are not sent
    // back down to the browser to be re-rendered into the HTML.
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const result = await depositCredentials(user, dealId, parsed.data);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}?deposited=1`);
}

export async function cancelDealAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");

  if (!dealId) return { message: "Missing deal." };

  try {
    const result = await cancelDeal(user, dealId);

    if (!result.ok) return { message: result.error };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}?cancelled=1`);
}
