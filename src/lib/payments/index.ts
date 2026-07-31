// Payment provider registry and the webhook processor. SERVER ONLY.
import { prisma } from "@/lib/prisma";
import { sandboxProvider } from "@/lib/payments/sandbox-provider";
import type { PaymentProvider } from "@/lib/payments/provider";

/**
 * Adapters available to the app. Add a real processor here and it becomes
 * selectable on a payment method — nothing else needs to change.
 */
const PROVIDERS: PaymentProvider[] = [sandboxProvider];

export function getProvider(name: string | null | undefined): PaymentProvider | null {
  if (!name) return null;
  return PROVIDERS.find((p) => p.name === name) ?? null;
}

export function listProviders(): { name: string; label: string }[] {
  return PROVIDERS.map((p) => ({ name: p.name, label: p.label }));
}

export type WebhookOutcome =
  | { status: 200; body: { received: true; effect: string } }
  | { status: 400 | 401 | 404 | 409; body: { error: string } };

/**
 * Processes one webhook delivery.
 *
 * Order matters and is deliberate:
 *
 *   1. Verify the signature FIRST, before parsing or touching the database. An
 *      unverified body is attacker-controlled input.
 *   2. Record the event id, which is what makes this idempotent. Providers
 *      retry on any non-2xx, so the same event *will* arrive twice; without
 *      this a retry would confirm a payment a second time.
 *   3. Only then act, and only on a payment we are actually expecting.
 *
 * Returns 200 for anything already handled, so the provider stops retrying.
 */
export async function processWebhook(
  providerName: string,
  rawBody: string,
  headers: Headers,
): Promise<WebhookOutcome> {
  const provider = getProvider(providerName);

  if (!provider) return { status: 404, body: { error: "Unknown payment provider." } };

  if (!provider.verifySignature(rawBody, headers)) {
    return { status: 401, body: { error: "Bad signature." } };
  }

  const event = provider.parseEvent(rawBody);

  if (!event) return { status: 400, body: { error: "Could not parse the event." } };

  // Replay protection. The unique index on (provider, eventId) is the actual
  // guarantee — checking first would leave a race between two simultaneous
  // deliveries of the same event.
  try {
    await prisma.webhookEvent.create({
      data: { provider: provider.name, eventId: event.eventId },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return { status: 200, body: { received: true, effect: "duplicate, ignored" } };
    }
    throw error;
  }

  if (event.kind === "ignored") {
    return { status: 200, body: { received: true, effect: "no action for this event type" } };
  }

  const intent = await prisma.paymentIntent.findUnique({
    where: { externalId: event.externalId },
    select: {
      id: true,
      dealId: true,
      status: true,
      amountCents: true,
      currency: true,
      deal: { select: { status: true, agreedPriceCents: true } },
    },
  });

  // A payment we never started. Accept the delivery so the provider stops
  // retrying, but change nothing.
  if (!intent) {
    return { status: 200, body: { received: true, effect: "no matching payment, ignored" } };
  }

  if (intent.status === "confirmed") {
    return { status: 200, body: { received: true, effect: "already confirmed" } };
  }

  if (event.kind === "failed" || event.kind === "expired") {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: event.kind === "failed" ? "failed" : "expired", lastPayload: rawBody },
    });

    return { status: 200, body: { received: true, effect: `marked ${event.kind}` } };
  }

  // --- a paid event ---

  // Underpayment must not settle a deal. Crypto especially arrives short when
  // the sender pays the network fee out of the amount.
  if (event.amountCents !== null && event.amountCents < intent.amountCents) {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { lastPayload: rawBody },
    });

    return {
      status: 200,
      body: {
        received: true,
        effect: `underpaid: expected ${intent.amountCents}, got ${event.amountCents} — left for the admin`,
      },
    };
  }

  // Confirm the payment and advance the deal together, so the deal can never
  // claim funds are held without a confirmed intent behind it.
  //
  // The deal update is conditional on the status the transition assumes, so a
  // webhook arriving late (after the admin already confirmed by hand) changes
  // nothing.
  const now = new Date();

  await prisma.$transaction([
    prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "confirmed", confirmedAt: now, lastPayload: rawBody },
    }),
    prisma.deal.updateMany({
      where: { id: intent.dealId, status: { in: ["awaiting_payment", "payment_submitted"] } },
      data: {
        status: "admin_verifying",
        paymentSubmittedAt: now,
        paymentConfirmedAt: now,
        verificationStartedAt: now,
        // paymentConfirmedById stays null: no human confirmed this one. That is
        // how the admin console can tell an automatic payment from a manual one.
        paymentReference: event.externalId,
      },
    }),
  ]);

  return { status: 200, body: { received: true, effect: "payment confirmed, deal moved to verifying" } };
}

/**
 * Starts an automatic payment for a deal and records the intent.
 * Reuses an existing pending intent so a buyer refreshing the page does not
 * create a pile of them.
 */
export async function startAutomaticPayment(
  providerName: string,
  deal: { id: string; reference: string; agreedPriceCents: number; currency: string },
): Promise<{ ok: true; instructions: string; redirectUrl: string | null } | { ok: false; error: string }> {
  const provider = getProvider(providerName);

  if (!provider) return { ok: false, error: "That payment method is not available right now." };

  const checkout = await provider.createCheckout({
    dealId: deal.id,
    reference: deal.reference,
    amountCents: deal.agreedPriceCents,
    currency: deal.currency,
  });

  await prisma.paymentIntent.upsert({
    where: { externalId: checkout.externalId },
    update: { amountCents: deal.agreedPriceCents, currency: deal.currency },
    create: {
      dealId: deal.id,
      provider: provider.name,
      externalId: checkout.externalId,
      amountCents: deal.agreedPriceCents,
      currency: deal.currency,
    },
  });

  return { ok: true, instructions: checkout.displayInstructions, redirectUrl: checkout.redirectUrl };
}
