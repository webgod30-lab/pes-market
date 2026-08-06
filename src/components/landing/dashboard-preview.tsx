"use client";

import { motion, useReducedMotion } from "motion/react";

import { BRAND } from "@/components/brand";

/**
 * The floating product shot under the hero.
 *
 * Drawn rather than screenshotted, on purpose. A screenshot of a real deal
 * would put someone's account summary and price on the marketing page, it
 * would go stale the first time the UI moved, and it would be a PNG that
 * cannot respond to the theme. This is markup: it reads correctly in light
 * and dark, stays sharp on any display, and shows the one moment worth
 * showing — money held, both halves in, neither released.
 *
 * The figures are obviously illustrative and labelled as a preview.
 */
export function DashboardPreview() {
  const reduced = useReducedMotion();

  const float = reduced
    ? {}
    : {
        animate: { y: [0, -10, 0] },
        transition: { duration: 7, ease: "easeInOut" as const, repeat: Infinity },
      };

  return (
    <motion.div
      {...float}
      className="relative mx-auto w-full max-w-3xl"
      initial={reduced ? undefined : { opacity: 0, y: 28, scale: 0.98 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
    >
      {/* Glow pooled under the panel, so it reads as lifted off the page. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 -bottom-6 h-24 rounded-[50%] bg-emerald-500/20 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)]/80 shadow-[var(--shadow-e3)] backdrop-blur-sm">
        {/* Window chrome. Three dots and a reference — enough to read as an
            application without pretending to be a specific browser. */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[var(--border-strong)]" />
            <span className="size-2.5 rounded-full bg-[var(--border-strong)]" />
            <span className="size-2.5 rounded-full bg-[var(--border-strong)]" />
          </span>
          <span className="ml-2 font-mono text-xs text-[var(--muted)]">ESC-7F3K9Q</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--tone-success)]">
            <span className="size-1.5 rounded-full bg-current" />
            Funds held
          </span>
        </div>

        <div className="grid gap-px bg-[var(--border)] sm:grid-cols-[1.4fr_1fr]">
          {/* Left: the deal */}
          <div className="bg-[var(--surface)] p-5">
            <p className="text-overline uppercase text-[var(--muted)]">What the seller promised</p>
            <p className="mt-2 text-sm leading-relaxed">
              eFootball 2026 mobile — 6 Epics, Team Strength 3341, original email included.
            </p>

            <div className="mt-5 space-y-2.5">
              <Step done label="Account deposited" note="encrypted on arrival" />
              <Step done label="Payment held" note="confirmed by admin" />
              <Step active label="Account verified" note="checked against the description" />
              <Step label="Released to buyer" />
              <Step label="Seller paid" />
            </div>
          </div>

          {/* Right: the money */}
          <div className="bg-[var(--surface)] p-5">
            <p className="text-overline uppercase text-[var(--muted)]">Held in escrow</p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">$240.00</p>

            <dl className="mt-4 space-y-2 border-t border-[var(--border)] pt-3 text-xs">
              <Row label="Buyer pays" value="$240.00" />
              <Row label="Escrow fee" value="−$12.00" />
              <Row label="Seller receives" value="$228.00" strong />
            </dl>

            <div className="mt-5 flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke={BRAND.emerald} strokeWidth="1.8">
                <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
                <path d="M8 10.5V7a4 4 0 018 0v3.5" strokeLinecap="round" />
              </svg>
              <p className="text-xs leading-snug text-[var(--muted)]">
                Neither side can reach the other&apos;s half.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-[var(--faint)]">
        Illustration of a deal in progress. Figures are examples.
      </p>
    </motion.div>
  );
}

function Step({
  label,
  note,
  done = false,
  active = false,
}: {
  label: string;
  note?: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${
          done
            ? "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)]"
            : active
              ? "border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)]"
              : "border-[var(--border)]"
        }`}
      >
        {done ? (
          <svg viewBox="0 0 12 12" className="size-2.5 text-[var(--tone-success)]" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M2.5 6.4 4.8 8.7 9.5 3.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : active ? (
          <span className="size-1.5 rounded-full bg-[var(--tone-warning)]" />
        ) : null}
      </span>
      <div className="min-w-0">
        <p className={`text-xs ${done || active ? "" : "text-[var(--muted)]"}`}>{label}</p>
        {note ? <p className="text-[0.6875rem] text-[var(--faint)]">{note}</p> : null}
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold text-[var(--tone-success)]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
