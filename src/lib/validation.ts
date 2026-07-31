// Input schemas shared by server actions and the NextAuth authorize() callback.
// Validation lives on the server: never trust the browser.
import { z } from "zod";

import { parsePriceToCents } from "@/lib/money";

/** Normalised email: trimmed and lowercased before the format check. */
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

/**
 * Sign-up takes no role. Everyone registers as a plain user, and whether they
 * are the buyer or the seller is decided per deal. "admin" is never
 * self-assignable — admins come from the seed script or a database change.
 */
export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(40, "Display name must be at most 40 characters."),
  email: emailField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    // bcrypt silently ignores bytes past 72; reject instead of truncating.
    .max(72, "Password must be at most 72 characters."),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

/** Accepts "185", "185.50" or "185,50" and yields whole cents. */
const priceField = z
  .string()
  .trim()
  .min(1, "Enter the price you agreed.")
  .transform((raw, ctx) => {
    const cents = parsePriceToCents(raw);

    if (cents === null) {
      ctx.addIssue({
        code: "custom",
        message: "Enter an amount like 185 or 185.50.",
      });
      return z.NEVER;
    }

    return cents;
  });

/** Empty input means "not specified", not zero. */
const optionalLevelField = z
  .string()
  .trim()
  .transform((raw, ctx) => {
    if (raw === "") return null;

    if (!/^\d{1,4}$/.test(raw)) {
      ctx.addIssue({ code: "custom", message: "Level must be a whole number." });
      return z.NEVER;
    }

    return Number(raw);
  });

const optionalTextField = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters.`)
    .transform((value) => (value === "" ? null : value));

export const createDealSchema = z.object({
  /** Which side the person opening the deal is on. */
  side: z.enum(["seller", "buyer"], { message: "Choose whether you are buying or selling." }),
  accountSummary: z
    .string()
    .trim()
    .min(20, "Describe the account in at least 20 characters, so both sides agree what is being sold.")
    .max(2000, "Keep the description under 2000 characters."),
  game: z.string().trim().min(1, "Which game is this account for?").max(60),
  platform: optionalTextField(40),
  level: optionalLevelField,
  agreedPriceCents: priceField,
});

export const depositCredentialsSchema = z.object({
  loginEmail: z.string().trim().min(1, "The account login is required."),
  loginPassword: z.string().min(1, "The account password is required."),
  recoveryEmail: optionalTextField(200).transform((v) => v ?? ""),
  recoveryEmailPassword: z.string().transform((v) => v.trim()),
  notes: z.string().trim().max(2000, "Keep notes under 2000 characters."),
});

export const joinDealSchema = z.object({
  inviteCode: z.string().trim().min(1, "Paste the invite code you were sent."),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export const submitPaymentSchema = z
  .object({
    paymentMethodId: z.string().trim().min(1, "Choose how you paid."),
    txHash: optionalTextField(200),
    reference: optionalTextField(200),
  })
  .refine((value) => value.txHash !== null || value.reference !== null, {
    // Without some kind of proof the admin has nothing to match against a
    // bank statement or block explorer.
    message: "Enter the transaction hash, or a reference the admin can match.",
    path: ["txHash"],
  });

export const verificationNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "Write what you checked.")
    .max(2000, "Keep the note under 2000 characters."),
});

export const payoutSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(1, "Enter the payout reference so the seller can match it.")
    .max(200),
});

// ---------------------------------------------------------------------------
// Trust: reviews and disputes
// ---------------------------------------------------------------------------

export const reviewSchema = z.object({
  rating: z
    .string()
    .trim()
    .transform((raw, ctx) => {
      const value = Number(raw);

      if (!Number.isInteger(value) || value < 1 || value > 5) {
        ctx.addIssue({ code: "custom", message: "Pick a rating from 1 to 5." });
        return z.NEVER;
      }

      return value;
    }),
  comment: optionalTextField(1000),
});

export const disputeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Give a short reason.")
    .max(120, "Keep the reason under 120 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Explain what went wrong in at least 20 characters — the admin decides from this.")
    .max(4000, "Keep it under 4000 characters."),
});

export const resolveDisputeSchema = z.object({
  outcome: z.enum(["buyer", "seller"], { message: "Choose who this is decided for." }),
  resolution: z
    .string()
    .trim()
    .min(1, "Write how you decided it.")
    .max(4000, "Keep it under 4000 characters."),
});

export const banUserSchema = z.object({
  userId: z.string().trim().min(1, "Missing user."),
  reason: z
    .string()
    .trim()
    .min(1, "Give a reason — the user is told what it was.")
    .max(500, "Keep the reason under 500 characters."),
});

export const paymentMethodSchema = z.object({
  id: optionalTextField(60),
  method: z.enum(["crypto", "card", "bank_transfer"], { message: "Pick a payment type." }),
  label: z.string().trim().min(1, "Give this method a name buyers will recognise.").max(60),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  instructions: z
    .string()
    .trim()
    .min(1, "Tell the buyer exactly what to do.")
    .max(2000, "Keep instructions under 2000 characters."),
  walletAddress: optionalTextField(200),
  network: optionalTextField(60),
  isAutomatic: z.boolean(),
  provider: optionalTextField(60),
});
