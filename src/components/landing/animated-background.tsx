"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * The ambient wash behind the hero.
 *
 * Two large blurred emerald orbs drifting slowly, over the existing grid
 * texture. Chosen over a particle field or an animated canvas for three
 * reasons: it costs two composited layers instead of a render loop, it cannot
 * jank on a mid-range phone, and it stays out of the way — a background that
 * draws attention has failed at being a background.
 *
 * Everything here is decoration. `aria-hidden` and `pointer-events-none`
 * throughout, and the whole thing sits behind the content on the z axis.
 */
export function AnimatedBackground() {
  const reduced = useReducedMotion();

  // Long, offset, non-integer periods so the two orbs never fall into a
  // visible rhythm with each other.
  const orbs = [
    {
      className: "left-[-18%] top-[-22%] size-[46rem] bg-emerald-500/12",
      animate: { x: [0, 70, -30, 0], y: [0, -50, 30, 0] },
      duration: 34,
    },
    {
      className: "right-[-22%] top-[-8%] size-[38rem] bg-sky-400/8",
      animate: { x: [0, -60, 40, 0], y: [0, 45, -25, 0] },
      duration: 41,
    },
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {orbs.map((orb, i) =>
        reduced ? (
          <div key={i} className={`absolute rounded-full blur-[110px] ${orb.className}`} />
        ) : (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[110px] ${orb.className}`}
            animate={orb.animate}
            transition={{ duration: orb.duration, ease: "easeInOut", repeat: Infinity }}
          />
        ),
      )}

      {/* Graph paper, masked out at the edges so it fades rather than stopping
          on a hard line. */}
      <div className="absolute inset-0 texture-grid" />

      {/* Hairline horizon. Gives the hero a bottom edge without a border,
          which would cut the orbs off mid-blur. */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
    </div>
  );
}
