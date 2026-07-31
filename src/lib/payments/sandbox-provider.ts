// A working provider you can drive yourself. SERVER ONLY.
//
// This is not a toy: it implements the same contract, the same HMAC signature
// scheme and the same event shape as a real processor, so the automatic path can
// be tested end to end before you have signed with anyone. Point a real adapter
// at the same interface and nothing else changes.
//
// Signature scheme (deliberately the common one):
//   x-payment-signature: sha256=<hex hmac of the raw body, keyed by the secret>
//
// Real providers differ in details — some sign a timestamp with the body to stop
// replays, some use a different header. Copy this file, change those bits, keep
// the shape.
import { createHmac, timingSafeEqual } from "node:crypto";

import {
  requireWebhookSecret,
  type ParsedPaymentEvent,
  type PaymentProvider,
  type ProviderCheckout,
} from "@/lib/payments/provider";

const SIGNATURE_HEADER = "x-payment-signature";

/** Exported so the test script can sign a body the same way a provider would. */
export function signSandboxPayload(rawBody: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
}

export const sandboxProvider: PaymentProvider = {
  name: "sandbox",
  label: "Sandbox (test gateway)",

  async createCheckout({ dealId, reference, amountCents, currency }): Promise<ProviderCheckout> {
    // A real adapter would call the provider's API and get an id back. Deriving
    // one from the deal keeps this deterministic and easy to drive by hand.
    const externalId = `sandbox_${reference}_${amountCents}`;

    return {
      externalId,
      redirectUrl: null,
      displayInstructions: [
        "This is the sandbox gateway — no real money moves.",
        `Payment id: ${externalId}`,
        "",
        "Simulate the provider confirming payment with:",
        `  npm run simulate:payment ${dealId}`,
        "",
        `Amount: ${(amountCents / 100).toFixed(2)} ${currency}`,
      ].join("\n"),
    };
  },

  verifySignature(rawBody, headers) {
    const provided = headers.get(SIGNATURE_HEADER);

    // An unsigned request is never acceptable. Without this check the endpoint
    // would let anyone mark any deal paid.
    if (!provided) return false;

    const expected = signSandboxPayload(rawBody, requireWebhookSecret("PAYMENTS_WEBHOOK_SECRET"));

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);

    // Length check first: timingSafeEqual throws on a mismatch, and comparing
    // with === would leak how much of the signature was correct via timing.
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  },

  parseEvent(rawBody): ParsedPaymentEvent | null {
    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return null;
    }

    if (typeof body !== "object" || body === null) return null;

    const { id, payment_id, status, amount_cents, currency } = body as Record<string, unknown>;

    if (typeof id !== "string" || typeof payment_id !== "string") return null;

    const kind =
      status === "paid"
        ? "paid"
        : status === "failed"
          ? "failed"
          : status === "expired"
            ? "expired"
            : "ignored";

    return {
      eventId: id,
      externalId: payment_id,
      kind,
      amountCents: typeof amount_cents === "number" ? amount_cents : null,
      currency: typeof currency === "string" ? currency : null,
    };
  },
};
