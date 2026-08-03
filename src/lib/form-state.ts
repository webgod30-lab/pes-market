// Shared shape for `useActionState` results, plus a small Zod-issue formatter.
import type { ZodError } from "zod";

export type FormState = {
  /** Error shown at the top of the form. */
  message?: string;
  /** Per-input errors, keyed by field name. */
  fieldErrors?: Record<string, string>;
  /** Echoed back so the user doesn't retype everything after a failure.
   *  Passwords are never echoed. */
  values?: Record<string, string>;
  /** Sign-in only: the password was right, now show the two-factor field. */
  needsSecondFactor?: boolean;
};

/** First error message per field: { email: "Enter a valid email address." } */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (typeof key === "string" && !result[key]) {
      result[key] = issue.message;
    }
  }

  return result;
}
