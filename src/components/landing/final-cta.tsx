"use client";

import { Reveal } from "@/components/landing/motion";
import { FINAL_CTA } from "@/components/landing/content";
import { ButtonLink } from "@/components/ui";

/**
 * The last thing on the page.
 *
 * One panel, one sentence, two buttons. The gradient wash and the ring are the
 * only decoration — anything more competes with the buttons, which are the
 * whole point of the section.
 */
export function FinalCta({
  primaryHref,
  primaryLabel,
  feeLine,
}: {
  primaryHref: string;
  primaryLabel: string;
  feeLine: string;
}) {
  return (
    <section aria-labelledby="cta-heading">
      <Reveal className="relative isolate overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center sm:px-12 sm:py-20">
        {/* A single emerald bloom behind the text, anchored top-centre so the
            heading sits in the brightest part of it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-80 opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 100%, var(--tone-success-bg), transparent 70%)",
          }}
        />
        <div aria-hidden="true" className="texture-grid absolute inset-0 -z-10 opacity-40" />

        <h2
          id="cta-heading"
          className="mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {FINAL_CTA.heading}
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-pretty text-[var(--muted)]">{FINAL_CTA.body}</p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href={primaryHref} size="lg">
            {primaryLabel}
          </ButtonLink>
          <ButtonLink href="/how-it-works" variant="secondary" size="lg">
            See how it works
          </ButtonLink>
        </div>

        <p className="mt-5 text-sm text-[var(--muted)]">{feeLine}</p>
      </Reveal>
    </section>
  );
}
