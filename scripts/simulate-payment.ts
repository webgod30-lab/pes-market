// Pretends to be a payment provider, so the automatic path can be tested
// without signing up to anything.
//
//   npm run simulate:payment <dealId>            confirm the payment
//   npm run simulate:payment <dealId> failed     simulate a failure
//   npm run simulate:payment <dealId> paid bad   send a WRONG signature
//   npm run simulate:payment <dealId> paid replay  send the same event twice
//
// It signs the body exactly the way the sandbox provider expects and POSTs it to
// the real webhook endpoint, so this exercises the same code path a live
// provider would.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { signSandboxPayload } from "../src/lib/payments/sandbox-provider";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

async function main() {
  const [dealId, statusArg = "paid", modeArg] = process.argv.slice(2);

  if (!dealId) {
    console.error("Usage: npm run simulate:payment <dealId> [paid|failed|expired] [bad|replay]");
    process.exit(1);
  }

  const intent = await prisma.paymentIntent.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    select: { externalId: true, amountCents: true, currency: true, status: true },
  });

  if (!intent) {
    console.error(
      `No payment intent for deal ${dealId}. The buyer has to press "Pay now" on an automatic method first.`,
    );
    process.exit(1);
  }

  const secret = process.env.PAYMENTS_WEBHOOK_SECRET;

  if (!secret) {
    console.error("PAYMENTS_WEBHOOK_SECRET is not set in .env.");
    process.exit(1);
  }

  const body = JSON.stringify({
    id: `evt_${Date.now()}`,
    payment_id: intent.externalId,
    status: statusArg,
    amount_cents: intent.amountCents,
    currency: intent.currency,
  });

  // A deliberately wrong signature, to prove the endpoint rejects it.
  const signature =
    modeArg === "bad" ? signSandboxPayload(body, "not-the-real-secret") : signSandboxPayload(body, secret);

  const url = `${APP_URL}/api/webhooks/payments/sandbox`;

  console.log(`POST ${url}`);
  console.log(`  payment: ${intent.externalId} (currently ${intent.status})`);
  console.log(`  status:  ${statusArg}${modeArg ? ` [${modeArg}]` : ""}`);

  const send = async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-payment-signature": signature },
      body,
    });

    const text = await response.text();
    console.log(`  → ${response.status} ${text}`);
    return response.status;
  };

  await send();

  // Providers retry on failure, so the same event id can arrive twice. This
  // proves the second one changes nothing.
  if (modeArg === "replay") {
    console.log("\nSending the exact same event again (as a provider retry would):");
    await send();
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
