"use client";

import { motion, useReducedMotion } from "motion/react";

import { ButtonLink, PulseBadge } from "@/components/ui";
import { AnimatedBackground } from "@/components/landing/animated-background";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { DURATION } from "@/components/landing/motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The hero.
 *
 * One idea, stated plainly, with the product directly underneath it. The
 * headline is the promise a visitor actually needs — not a feature and not a
 * category — because most people arrive from a chat message with a link in it
 * and about four seconds of patience.
 *
 * The load sequence is orchestrated rather than staggered per element: badge,
 * headline, subhead, buttons, preview, each a beat behind the last. Above the
 * fold this runs on mount instead of on scroll, since it is already in view.
 */
export function Hero({ signedIn, dashboardHref }: { signedIn: boolean; dashboardHref: string }) {
  const reduced = useReducedMotion();

  // A single ladder of delays, so the sequence is legible in one place.
  const step = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.base, ease: EASE, delay: 0.06 * i },
        };

  return (
    <section className="relative -mt-8 overflow-hidden pt-16 pb-6 sm:-mt-10 sm:pt-24">
      <AnimatedBackground />

      <div className="text-center">
        <motion.div {...step(0)} className="mb-5 flex justify-center">
          <PulseBadge>Escrow for game account trades</PulseBadge>
        </motion.div>

        {/* The type scale earns its keep here: text-display carries its own
            leading and tracking, so the largest text on the site cannot end
            up loosely set. */}
        <motion.h1
          {...step(1)}
          className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.025em] sm:text-5xl lg:text-6xl"
        >
          You two agreed the deal.
          <br className="hidden sm:block" />{" "}
          <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] bg-clip-text text-transparent">
            We make sure nobody gets robbed.
          </span>
        </motion.h1>

        <motion.p
          {...step(2)}
          className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-[var(--muted)] sm:text-lg"
        >
          Not a shop — there is nothing to browse here. Bring a deal you already agreed on. The
          account is held encrypted, the money is held in escrow, and neither moves until the trade
          actually works.
        </motion.p>

        <motion.div {...step(3)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {signedIn ? (
            <ButtonLink href={dashboardHref} size="lg">
              Go to your deals
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/register" size="lg">
                Start a deal
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" size="lg">
                I have an invite code
              </ButtonLink>
            </>
          )}
        </motion.div>

        <motion.p {...step(4)} className="mt-4 text-sm text-[var(--muted)]">
          Free to open a deal. You only pay when one completes.
        </motion.p>
      </div>

      <div className="mt-14 sm:mt-20">
        <DashboardPreview />
      </div>
    </section>
  );
}
