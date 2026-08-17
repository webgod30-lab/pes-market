"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { formatCents } from "@/lib/money";
import type { PublicPayoutRow } from "@/lib/referrals";

/** How often the list re-fetches while somebody is reading the page. */
const REFRESH_MS = 30_000;

/** How often the displayed ages recompute. */
const TICK_MS = 30_000;

/** Ticks every TICK_MS so the ages count up on their own. */
function subscribeToClock(onChange: () => void): () => void {
  const timer = setInterval(onChange, TICK_MS);

  return () => clearInterval(timer);
}

/**
 * Bucketed, not raw.
 *
 * useSyncExternalStore re-renders whenever the snapshot changes by identity, so
 * returning Date.now() directly would loop forever. Flooring to the tick makes
 * it stable between ticks — and the display granularity is minutes anyway.
 */
const clockSnapshot = () => Math.floor(Date.now() / TICK_MS);

/** Null on the server, so the markup it sends has no time baked into it. */
const clockOnServer = () => null;

/**
 * Live credits, on the page that asks people to trust the money is real.
 *
 * The rows are rendered on the server and this component only re-requests
 * them — `router.refresh()` re-runs the server component and swaps in new
 * markup without a full navigation. No client-side data fetching, no API
 * route, and no risk of the browser being handed anything the server would not
 * already have shown.
 *
 * Thirty seconds rather than a socket. A payout arrives every few hours at
 * best; a live connection to carry that would be cost with no benefit, and the
 * page would poll an idle endpoint all day for the same result.
 *
 * Names are already shortened to a first name and an initial upstream — see
 * listRecentPayouts. Nothing here can widen that, because nothing here has the
 * full name to widen it to.
 */
export function PayoutTicker({ payouts }: { payouts: PublicPayoutRow[] }) {
  const router = useRouter();

  // The clock read as an external store rather than as state written from an
  // effect. Reading it during render would be impure, and it would also hydrate
  // wrong: the server stamps one time into the HTML and the browser computes
  // another a moment later. Null until mounted means both agree on an empty
  // slot, and the ages appear once the client owns the render.
  const bucket = useSyncExternalStore(subscribeToClock, clockSnapshot, clockOnServer);
  const now = bucket === null ? null : bucket * TICK_MS;

  useEffect(() => {
    const refresh = setInterval(() => router.refresh(), REFRESH_MS);

    return () => clearInterval(refresh);
  }, [router]);

  // Nothing yet, so nothing is claimed. An empty ticker on a recruitment page
  // is worse than no ticker: it says the programme exists and pays nobody.
  if (payouts.length === 0) return null;

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="relative flex size-2 shrink-0"
        >
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[var(--accent)]" />
        </span>
        <p className="text-overline uppercase text-[var(--muted)]">Paid out just now</p>
      </div>

      <ul className="mt-3 space-y-1.5">
        {payouts.map((payout) => (
          <li
            key={payout.id}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm"
          >
            <span className="text-[var(--muted)]">
              <strong className="font-medium text-[var(--foreground)]">
                {payout.promoterName}
              </strong>{" "}
              earned{" "}
              <strong className="font-medium tabular-nums text-[var(--tone-success)]">
                {formatCents(payout.amountCents, payout.currency)}
              </strong>
            </span>
            <span className="text-xs tabular-nums text-[var(--faint)]">
              {now === null ? "" : relativeTime(payout.createdAt, now)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-[var(--border)] pt-2.5 text-xs leading-relaxed text-[var(--muted)]">
        Every credit here is a real swap that completed through the escrow. Names are shortened —
        what somebody earns is their business, not the page&apos;s.
      </p>
    </div>
  );
}

/**
 * Age of a credit, against a clock the caller owns.
 *
 * `now` is passed in rather than read here so this stays a pure function of its
 * arguments — and so the ticker's own interval is what makes the ages count up,
 * rather than each row deciding independently what time it is.
 */
function relativeTime(at: Date, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(at).getTime()) / 1000));

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}
