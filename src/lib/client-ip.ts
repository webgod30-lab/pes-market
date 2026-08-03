// Who is making this request, for rate-limiting purposes. SERVER ONLY.
//
// Kept apart from src/lib/rate-limit.ts on purpose: that module is pure and is
// exercised directly by the test scripts, which have no request to read
// headers from.
import { headers } from "next/headers";

/**
 * Best-effort client address.
 *
 * `x-forwarded-for` is a header, and a header is whatever the client says it
 * is — except behind a proxy that overwrites it, which is what Vercel does.
 * Deployed, the leftmost entry is the real peer. Run anywhere else, or direct,
 * the header is absent or forgeable, so this is a speed bump rather than
 * identity: everything gated on it is also gated on a per-account limit that
 * no header can influence.
 */
export async function clientIp(): Promise<string> {
  const store = await headers();

  const forwarded = store.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return store.get("x-real-ip")?.trim() || "unknown";
}
