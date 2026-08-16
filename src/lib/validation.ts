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
 *
 * A promoter's code is required. Everyone on the site arrived through somebody,
 * and there is no way in without one — which is also what makes the referral
 * program worth anything to the people promoting it.
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
  /**
   * Only checked for shape here. Whether the code belongs to a real, unbanned
   * promoter is a database question, so registerAction answers it — this just
   * catches an empty box before anything is looked up.
   */
  referralCode: z
    .string()
    .trim()
    .min(1, "You need a promoter's code to join. Ask the person who sent you here for theirs.")
    .max(40, "That is longer than a referral code."),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

/**
 * Applying to become a promoter, at /promote.
 *
 * The one public form that does not need a code — it is the way in for someone
 * who has nobody to get a code from. The password is taken up front so that
 * approving is one click rather than a second round of emails.
 */
export const promoterApplicationSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(40, "Display name must be at most 40 characters."),
  email: emailField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."),
  /**
   * The only thing an admin really decides on, so it asks for enough to decide
   * with. A one-word answer is not a case.
   */
  channel: z
    .string()
    .trim()
    .min(20, "Say where you would promote it, and roughly how many people you reach.")
    .max(1000, "Keep it under 1000 characters."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

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

/**
 * Opening a swap.
 *
 * There is no price and no trade kind to choose. Every deal is
 * account-for-account, so both descriptions are required and neither side owes
 * the other money — which is why nothing here parses an amount.
 */
export const createDealSchema = z.object({
  /**
   * Which side the person opening the deal is on.
   *
   * The two sides of a swap are symmetric, so this decides nothing about who
   * pays — nobody does. It decides whose account is described in which box, and
   * which side the invite leaves open.
   */
  side: z.enum(["seller", "buyer"], { message: "Choose which account is yours." }),
  accountSummary: z
    .string()
    .trim()
    .min(20, "Describe your account in at least 20 characters, so both sides agree what is being traded.")
    .max(2000, "Keep the description under 2000 characters."),
  /** The account expected in exchange. */
  counterAccountSummary: z
    .string()
    .trim()
    .min(20, "Describe the account you expect in exchange, in at least 20 characters.")
    .max(2000, "Keep the description under 2000 characters."),
  game: z.string().trim().min(1, "Which game is this account for?").max(60),
  platform: optionalTextField(40),
  level: optionalLevelField,
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

export const requestTransferCodeSchema = z.object({
  note: z.string().trim().max(300, "Keep it under 300 characters."),
});

export const provideTransferCodeSchema = z.object({
  requestId: z.string().trim().min(1, "Missing request."),
  code: z
    .string()
    .trim()
    .min(1, "Enter the code Konami sent you.")
    .max(64, "That does not look like a verification code."),
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

/** A seller asking to be paid out. */
const withdrawalAmount = z
  .string()
  .trim()
  .min(1, "Enter how much you want to withdraw.")
  .transform((raw, ctx) => {
    const cents = parsePriceToCents(raw);

    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 50 or 50.25." });
      return z.NEVER;
    }

    return cents;
  });

/**
 * Whoever the transfer is addressed to.
 *
 * Required for every method: banks and most wallets reject a payment whose
 * name does not match the account, and a crypto payout still needs a human
 * attached to it when something goes wrong.
 */
const destinationName = z
  .string()
  .trim()
  .min(2, "Put the full name on the account.")
  .max(120, "That is longer than a name needs to be.");

/**
 * Each method asks for the fields that method actually needs, rather than one
 * box of text. A network missing from a crypto payout is the difference
 * between arriving and being lost, and an IBAN pasted into the same field as
 * an account holder's name is a transfer that bounces.
 */
export const withdrawalSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("crypto"),
    amountCents: withdrawalAmount,
    destinationName,
    destinationAccount: z
      .string()
      .trim()
      .min(20, "That does not look like a full wallet address.")
      .max(200, "That is longer than a wallet address."),
    destinationNetwork: z
      .string()
      .trim()
      .min(2, "Say which network — the same address on the wrong one loses the money.")
      .max(60),
  }),
  z.object({
    method: z.literal("bank_transfer"),
    amountCents: withdrawalAmount,
    destinationName,
    destinationAccount: z
      .string()
      .trim()
      .min(5, "Enter the IBAN or account number.")
      .max(60, "That is longer than an IBAN."),
    destinationBank: z.string().trim().min(2, "Which bank?").max(120),
    // Domestic transfers do not need one, so this is not forced.
    destinationBic: z.string().trim().max(20, "A BIC is at most 11 characters.").optional(),
  }),
  z.object({
    method: z.literal("card"),
    amountCents: withdrawalAmount,
    destinationName,
    destinationAccount: z
      .string()
      .trim()
      .min(3, "Enter the email or handle on the account.")
      .max(160),
    destinationProvider: z
      .string()
      .trim()
      .min(2, "Which service — PayPal, Wise, Payoneer?")
      .max(60),
  }),
]);
