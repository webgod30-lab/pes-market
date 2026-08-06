"use client";

import { motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The landing page's motion vocabulary.
 *
 * Four primitives, used everywhere, so the page moves like one thing rather
 * than twelve sections each easing differently. Anything that needs to animate
 * reaches for one of these instead of writing its own transition.
 *
 * Every one checks `useReducedMotion` and renders the final state immediately
 * when it is set. That is not a nicety — vestibular disorders make large
 * scroll-triggered movement genuinely unpleasant, and the setting is the
 * person telling you so.
 */

/** The house easing. Slightly overshooting cubic — reads as crisp, not bouncy. */
const EASE = [0.16, 1, 0.3, 1] as const;

export const DURATION = { fast: 0.35, base: 0.55, slow: 0.8 } as const;

// ---------------------------------------------------------------------------
// Reveal on scroll
// ---------------------------------------------------------------------------

/**
 * Fades and lifts its children when they scroll into view, once.
 *
 * `once` matters: re-animating every time a section re-enters the viewport
 * turns scrolling back up into a light show.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  /** Distance travelled. Keep it small — long slides feel cheap. */
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: DURATION.base, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}

/**
 * A container whose children arrive one after another.
 *
 * Pair with `RevealItem`. The stagger is deliberately short — long enough to
 * read as sequence, short enough that the last card is not still arriving
 * after the reader has moved on.
 */
export function RevealGroup({
  children,
  className = "",
  stagger = 0.07,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const variants: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: stagger } },
  };

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </Component>
  );
}

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
};

export function RevealItem({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component className={className} variants={ITEM_VARIANTS}>
      {children}
    </Component>
  );
}

// ---------------------------------------------------------------------------
// Counting up
// ---------------------------------------------------------------------------

/**
 * Counts to a number when it scrolls into view.
 *
 * Formatting is passed in rather than inferred, because these are money and
 * counts and percentages and each one is written differently — and money is
 * formatted by src/lib/money.ts, which knows about currency.
 *
 * Reduced motion, or no JavaScript, gets the final value with no count.
 */
export function CountUp({
  to,
  format,
  duration = 1.4,
  className = "",
}: {
  to: number;
  format: (value: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced || !inView) return;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // Ease out cubic: fast at first, settling into the final figure, which
      // reads as a counter arriving rather than a number scrubbing.
      setValue(to * (1 - Math.pow(1 - t, 3)));

      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(to);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to, duration]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Continuous marquee
// ---------------------------------------------------------------------------

/**
 * A strip that slides forever.
 *
 * The children are rendered twice and the track moves exactly minus-half its
 * width, so the second copy lands where the first began and the seam is
 * invisible. Duplicating in the DOM is what makes it seamless without
 * measuring anything at runtime.
 *
 * The copy is aria-hidden so a screen reader reads the list once, not twice.
 */
export function Marquee({
  children,
  speed = 38,
  className = "",
}: {
  children: ReactNode;
  /** Seconds for one full pass. Slower reads as premium; faster as urgent. */
  speed?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-3 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="flex w-max items-center gap-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        <div className="flex shrink-0 items-center gap-8">{children}</div>
        <div className="flex shrink-0 items-center gap-8" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
