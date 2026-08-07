"use client";

import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { SECTIONS } from "@/components/landing/content";
import { motion, useReducedMotion } from "motion/react";

import { Reveal } from "@/components/landing/motion";
import { escrowSteps } from "@/lib/escrow-flow";

/**
 * The seven steps, as a vertical timeline.
 *
 * A timeline rather than a grid of cards, because these are strictly ordered
 * and a grid says they are not. The connecting rail draws itself as the
 * section scrolls into view, which is the one place on this page where motion
 * carries meaning rather than polish: it traces the sequence in the order it
 * happens.
 */
export function HowItWorks({ locale }: { locale: Locale }) {
  const copy = SECTIONS[locale];
  const steps = escrowSteps(locale);
  const reduced = useReducedMotion();

  return (
    <section aria-labelledby="how-heading">
      <Reveal className="mb-12 text-center">
        <h2
          id="how-heading"
          className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {copy.howTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-[var(--muted)]">
          {copy.howBody}
        </p>
      </Reveal>

      <ol className="relative mx-auto max-w-2xl">
        {/* The rail. Absolutely positioned behind the markers, drawn top-down
            as the list enters view. */}
        <div aria-hidden="true" className="absolute start-[15px] top-2 bottom-2 w-px bg-[var(--border)]">
          {!reduced ? (
            <motion.div
              className="h-full w-full origin-top bg-gradient-to-b from-[var(--accent)] to-transparent"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          ) : null}
        </div>

        {steps.map((step, index) => (
          <motion.li
            key={step.n}
            className="relative flex gap-5 pb-8 last:pb-0"
            initial={reduced ? undefined : { opacity: 0, x: -8 }}
            whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
          >
            <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold tabular-nums">
              {step.n}
            </span>

            <div className="min-w-0 pt-1">
              <p className="text-overline uppercase text-[var(--accent)]">{step.who}</p>
              <h3 className="mt-1 text-base font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{step.short}</p>
            </div>
          </motion.li>
        ))}
      </ol>

      <Reveal className="mt-10 text-center">
        {/* inline-flex + min-h-9: as bare inline text this was a 19px target,
            under the 24px minimum and easy to miss on a phone. Same reason as
            the footer links. */}
        <Link
          href="/how-it-works"
          className="inline-flex min-h-9 items-center text-sm text-[var(--accent)] hover:underline"
        >
          {copy.howMore}
        </Link>
      </Reveal>
    </section>
  );
}
