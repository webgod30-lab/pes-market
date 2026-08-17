"use server";

// Server actions for the promoter programme: the public application, and the
// admin's decision on it.
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/dal";
import { promoterApplicationSchema } from "@/lib/validation";
import { approveApplication, rejectApplication, submitApplication } from "@/lib/promoters";
import { fieldErrorsFrom, type FormState } from "@/lib/form-state";
import { databaseProblemMessage } from "@/lib/db-errors";
import { clientIp } from "@/lib/client-ip";
import {
  describeRetryAfter,
  hitRateLimits,
  PROMOTER_APPLICATION_BY_IP,
} from "@/lib/rate-limit";

export async function applyToPromoteAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const rawValues = {
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    channel: String(formData.get("channel") ?? ""),
    payoutMethod: String(formData.get("payoutMethod") ?? ""),
  };

  // Everything back except the password. The channel answer especially — it is
  // the longest thing on the form and losing it to a typo'd email address is
  // how an application gets abandoned.
  const echo = {
    displayName: rawValues.displayName,
    email: rawValues.email,
    channel: rawValues.channel,
    payoutMethod: rawValues.payoutMethod,
  };

  const parsed = promoterApplicationSchema.safeParse(rawValues);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values: echo };
  }

  // Checked after validation so a malformed submission does not spend someone's
  // budget, and before the database work so a flood is cheap to refuse.
  try {
    const limit = await hitRateLimits([
      { key: `promote:ip:${await clientIp()}`, rule: PROMOTER_APPLICATION_BY_IP },
    ]);

    if (!limit.allowed) {
      return {
        message: `Too many applications from here. Try again in ${describeRetryAfter(limit.retryAfterSeconds)}.`,
        values: echo,
      };
    }
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: echo };
    throw error;
  }

  try {
    const result = await submitApplication(parsed.data);

    if (!result.ok) return { message: result.error, values: echo };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem, values: echo };
    throw error;
  }

  revalidatePath("/admin/promoters");

  // Deliberately the same answer whether this created an application, updated
  // one, or did nothing because the address already has an account. Anything
  // else turns a public form into a way of asking "does this person trade game
  // accounts here?".
  return {
    success:
      "Application received. We read every one by hand — if it is a fit you will get an email with your code.",
  };
}

async function adminDecision(fn: (admin: Awaited<ReturnType<typeof requireRole>>) => Promise<{ ok: boolean; error?: string }>): Promise<FormState> {
  const admin = await requireRole(["admin"], "/admin/promoters");

  try {
    const result = await fn(admin);

    if (!result.ok) return { message: result.error ?? "That did not work." };
  } catch (error) {
    const dbProblem = databaseProblemMessage(error);
    if (dbProblem) return { message: dbProblem };
    throw error;
  }

  revalidatePath("/admin/promoters");
  revalidatePath("/admin");

  return {};
}

export async function approveApplicationAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("applicationId") ?? "");
  const note = String(formData.get("note") ?? "");

  return adminDecision((admin) => approveApplication(admin, id, note));
}

export async function rejectApplicationAction(
  _previousState: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("applicationId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  return adminDecision((admin) => rejectApplication(admin, id, reason));
}
