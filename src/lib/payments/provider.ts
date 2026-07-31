// The payment provider contract. SERVER ONLY.
//
// Phases 1-5 settled every payment by hand: the buyer said they sent money, the
// admin looked at a wallet and pressed confirm. This adds the automatic path —
// a provider tells us over a webhook that money arrived, and the deal advances
// without anyone watching.
//
// Everything provider-specific lives behind this interface so that signing with
// a different processor means writing one adapter, not touching the deal logic.
//
// WHY IT IS SHAPED THIS WAY
//
// A webhook is an unauthenticated public endpoint that moves money. Two things
// therefore are not optional, and both live in the shared handler rather than in
// each adapter, so a new adapter cannot forget them:
//
//   1. Signature verification — otherwise anyone who learns the URL can mark
//      any deal paid.
//   2. Idempotency — providers retry on any non-2xx, so the same event will
//      arrive more than once.

export type PaymentEventKind = "paid" | "failed" | "expired" | "ignored";

/** What an adapter extracts from a raw webhook body. */
export type ParsedPaymentEvent = {
  /** The provider's id for this event. Used for replay protection. */
  eventId: string;
  /** The provider's id for the payment itself. Matches PaymentIntent.externalId. */
  externalId: string;
  kind: PaymentEventKind;
  /** Minor units, as the provider reported them. Checked against the deal. */
  amountCents: number | null;
  currency: string | null;
};

export type ProviderCheckout = {
  externalId: string;
  /** Where to send the buyer, when the provider hosts the payment page. */
  redirectUrl: string | null;
  /** Shown in-page when there is no redirect — an address to send crypto to. */
  displayInstructions: string;
};

export interface PaymentProvider {
  /** Matches PaymentMethodConfig.provider. */
  readonly name: string;

  /** Human name for the admin UI. */
  readonly label: string;

  /**
   * Starts a payment. Real adapters call the provider's API here; the sandbox
   * one just invents an id.
   */
  createCheckout(input: {
    dealId: string;
    reference: string;
    amountCents: number;
    currency: string;
  }): Promise<ProviderCheckout>;

  /**
   * Confirms the request really came from the provider.
   *
   * Implementations must compare in constant time and must not accept an
   * absent signature. Returning false rejects the delivery with a 401.
   */
  verifySignature(rawBody: string, headers: Headers): boolean;

  /** Turns a verified body into something the handler can act on. */
  parseEvent(rawBody: string): ParsedPaymentEvent | null;
}

/** Reads a webhook secret, failing loudly rather than silently accepting anything. */
export function requireWebhookSecret(envVar: string): string {
  const secret = process.env[envVar];

  if (!secret || secret.trim().length < 16) {
    throw new Error(
      `${envVar} is missing or too short. Set it to a long random string — it is the only thing stopping anyone from marking deals as paid.`,
    );
  }

  return secret;
}
