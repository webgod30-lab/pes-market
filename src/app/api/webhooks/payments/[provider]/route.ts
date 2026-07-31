// Payment provider webhooks.
//
// This is a public, unauthenticated endpoint that can move a deal forward, so
// it is deliberately thin: read the raw body, hand it to the processor, return
// what it says. All verification lives in src/lib/payments.
//
// The body is read with .text() and never re-serialized — a signature covers the
// exact bytes the provider sent, and JSON.parse followed by JSON.stringify would
// change them (key order, whitespace) and break verification.
import { processWebhook } from "@/lib/payments";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  const rawBody = await request.text();

  try {
    const outcome = await processWebhook(provider, rawBody, request.headers);

    return Response.json(outcome.body, { status: outcome.status });
  } catch (error) {
    // Deliberately vague to the caller — this endpoint is public. The detail
    // goes to the server log.
    console.error("Webhook processing failed:", error instanceof Error ? error.message : error);

    // A 500 tells the provider to retry, which is what we want for a transient
    // database problem.
    return Response.json({ error: "Could not process the event." }, { status: 500 });
  }
}
