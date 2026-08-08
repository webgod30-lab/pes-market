"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/components/ui";

/** How far down the page the bar switches to its condensed, denser state. */
const CONDENSE_AT = 24;

/**
 * The sticky glass bar.
 *
 * A client component only because of the scroll behaviour. Everything inside it
 * — including the session lookup — is still rendered on the server and passed
 * through as children, so making the frame interactive does not drag the whole
 * header into the browser bundle.
 *
 * Deliberately no animation library. This header renders in the root layout, on
 * every route including /login and the admin console, so anything imported here
 * is imported everywhere. A scroll subscription and two CSS transitions cost a
 * few hundred bytes; motion would cost tens of kilobytes on pages that have no
 * other animation at all.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(
    scrollStore.subscribe,
    scrollStore.getSnapshot,
    scrollStore.getServerSnapshot,
  );

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
        "backdrop-blur-xl backdrop-saturate-150 motion-reduce:transition-none",
        // Resting: barely there, so the page reads as one surface. Scrolled:
        // denser and lifted, because now there is content sliding underneath
        // that the bar has to stay legible against.
        scrolled
          ? "border-[var(--glass-border)] bg-[var(--glass-bar-dense)] shadow-[var(--shadow-md)]"
          : "border-transparent bg-[var(--glass-bar)]",
      )}
    >
      {/* The lit top edge. Sits above the blur, fades out at both ends so it
          reads as a highlight rather than a second border. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--glass-highlight)] to-transparent"
      />

      {/* Height is the other half of the scroll animation: the bar condenses
          rather than just changing colour, which is what makes it feel like it
          is reacting to the scroll instead of toggling a class. */}
      <div
        // The bar keeps its left-to-right order in every language: logo first,
        // then the nav, with the account controls at the far end. Only the
        // *arrangement* is pinned — each label inside is still Arabic text and
        // the browser's bidi handling renders it right-to-left within its own
        // box. Mirroring the whole bar would move the logo across and reverse
        // the reading order of a masthead people already know.
        //
        // Scoped to this element, not the page: the content below stays RTL,
        // which is what Arabic prose needs.
        dir="ltr"
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4",
          "transition-[height] duration-300 motion-reduce:transition-none",
          scrolled ? "h-14" : "h-16",
        )}
      >
        {children}
      </div>

      <ScrollProgress />
    </header>
  );
}

/**
 * A hairline along the bottom edge showing how far down the page you are.
 *
 * Driven by a CSS scroll-timeline, so it runs on the compositor and costs no
 * JavaScript at all. Browsers without `animation-timeline` support simply never
 * scale it up, which leaves an invisible 1px strip — the correct thing to do
 * with pure decoration.
 */
function ScrollProgress() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden"
    >
      <div className="scroll-progress h-full w-full origin-left scale-x-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)]" />
    </div>
  );
}

/**
 * Whether the page has scrolled, as external state.
 *
 * Same reasoning as the theme toggle: the scroll position lives outside React,
 * so it is subscribed to rather than mirrored into state and synced in an
 * effect. The snapshot is a boolean, not the pixel offset — returning the
 * offset would re-render the header on every frame of a scroll, and the header
 * only cares about one threshold.
 */
const scrollStore = {
  subscribe(onChange: () => void) {
    // Passive: this listener never calls preventDefault, and saying so keeps it
    // off the critical path of the scroll itself.
    window.addEventListener("scroll", onChange, { passive: true });
    return () => window.removeEventListener("scroll", onChange);
  },

  getSnapshot(): boolean {
    return window.scrollY > CONDENSE_AT;
  },

  /**
   * False on the server: a fresh page load starts at the top, and the header
   * renders in its resting state either way. On a restored scroll position the
   * first snapshot after hydration corrects it.
   */
  getServerSnapshot(): boolean {
    return false;
  },
};
