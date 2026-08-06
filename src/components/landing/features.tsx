"use client";

import { Reveal, RevealGroup, RevealItem } from "@/components/landing/motion";
import { FEATURES } from "@/components/landing/content";
import { LockIcon, ScalesIcon, VaultIcon } from "@/components/graphics";

const ICONS = {
  lock: LockIcon,
  vault: VaultIcon,
  scales: ScalesIcon,
} as const;

/**
 * What the service actually does.
 *
 * A bento grid rather than three equal columns: the encryption card carries
 * the most weight and gets the wide cell, which stops the section reading as
 * three interchangeable features and tells the eye what matters most.
 */
export function Features() {
  return (
    <section aria-labelledby="features-heading">
      <Reveal className="mb-10 text-center">
        <h2
          id="features-heading"
          className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Both halves are held. Neither side is exposed.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-[var(--muted)]">
          In a normal account trade someone has to move first, and that person can simply be robbed.
          This removes the choice.
        </p>
      </Reveal>

      <RevealGroup className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => {
          const Icon = ICONS[feature.icon];

          return (
            <RevealItem
              key={feature.title}
              className={feature.wide ? "sm:col-span-2" : undefined}
            >
              <div className="group h-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]/40">
                <span className="grid size-10 place-items-center rounded-[var(--radius-control)] border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--accent)] transition-transform group-hover:scale-105">
                  <Icon />
                </span>

                <h3 className="mt-4 text-base font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                  {feature.body}
                </p>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
