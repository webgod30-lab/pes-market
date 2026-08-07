"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Reveal } from "@/components/landing/motion";
import type { Faq } from "@/components/faq-content";

/**
 * The objections, answered before they are raised.
 *
 * The questions arrive as props rather than being read here, because the
 * answers depend on the configured fee and this has to be a client component
 * to animate. React elements cross the server boundary fine, so the server
 * renders the answers and this only opens and closes them.
 */
export function LandingFaq({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.q ?? null);

  return (
    <section aria-labelledby="faq-heading">
      <Reveal className="mb-10 text-center">
        <h2
          id="faq-heading"
          className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          The questions people ask first
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-[var(--muted)]">
          Including the ones with awkward answers.
        </p>
      </Reveal>

      <Reveal className="mx-auto max-w-2xl divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)]">
        {items.map((item) => (
          <FaqRow
            key={item.q}
            item={item}
            open={open === item.q}
            onToggle={() => setOpen(open === item.q ? null : item.q)}
          />
        ))}
      </Reveal>

      {/* inline-flex + min-h-9 on the links: as bare inline text they are 19px
          tall, under the minimum tap target, and here they sit close together. */}
      <Reveal className="mt-8 text-center text-sm text-[var(--muted)]">
        <Link
          href="/faq"
          className="inline-flex min-h-9 items-center text-[var(--accent)] hover:underline"
        >
          Every question, answered
        </Link>{" "}
        — or{" "}
        <Link
          href="/contact"
          className="inline-flex min-h-9 items-center text-[var(--accent)] hover:underline"
        >
          ask us directly
        </Link>
      </Reveal>
    </section>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: Faq;
  open: boolean;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  const panelId = useId();

  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-medium transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {item.q}

          {/* A plus that becomes a minus. Two strokes, one of which rotates
              flat — cheaper to read than a chevron flip. */}
          <span aria-hidden="true" className="relative grid size-4 shrink-0 place-items-center">
            <span className="absolute h-px w-3.5 bg-[var(--muted)]" />
            <motion.span
              className="absolute h-px w-3.5 bg-[var(--muted)]"
              initial={false}
              animate={{ rotate: open ? 0 : 90 }}
              transition={reduced ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
            />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
