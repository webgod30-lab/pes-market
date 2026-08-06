"use client";

import { useSyncExternalStore } from "react";

/**
 * Light / dark switch.
 *
 * Until someone presses it there is no stored choice at all, and the CSS
 * follows the device through prefers-color-scheme. Pressing it writes
 * data-theme on <html>, which beats that media query in globals.css, and
 * records the choice in localStorage so it survives a reload.
 */
export const THEME_STORAGE_KEY = "pes-escrow-theme";

/**
 * Runs before first paint, from a blocking inline script in the layout, so a
 * visitor who chose light never sees a dark frame first. Kept as a string
 * because it has to exist before React does.
 */
export const themeBootScript = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(c==="light"||c==="dark"){document.documentElement.setAttribute("data-theme",c)}}catch(e){}})()`;

/** Fired by pick(), so the button updates in the same tick the attribute does. */
const THEME_EVENT = "pes-escrow:themechange";

/**
 * The applied theme is external state, not React state.
 *
 * It lives in three places React does not own — the `data-theme` attribute on
 * <html>, localStorage, and the device's `prefers-color-scheme` — and any of
 * them can change without React being told. Mirroring that into `useState` and
 * syncing it in an effect is the thing `useSyncExternalStore` exists to
 * replace, and the earlier version of this file did exactly that: a `mounted`
 * flag set inside an effect, plus a counter bumped only to force a re-render.
 * That is two cascading renders on every mount, and it tripped
 * react-hooks/set-state-in-effect.
 */
const themeStore = {
  subscribe(onChange: () => void) {
    const query = window.matchMedia("(prefers-color-scheme: light)");

    query.addEventListener("change", onChange);
    // Dispatched by pick() below, so choosing a theme updates the button in
    // the same tick the attribute changes.
    window.addEventListener(THEME_EVENT, onChange);

    return () => {
      query.removeEventListener("change", onChange);
      window.removeEventListener(THEME_EVENT, onChange);
    };
  },

  /** Whatever is actually on screen right now. */
  getSnapshot(): "light" | "dark" {
    const chosen = document.documentElement.getAttribute("data-theme");

    if (chosen === "light" || chosen === "dark") return chosen;

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  },

  /**
   * Null on the server, because the device preference is genuinely unknown
   * there. React renders this during hydration and swaps to the real value
   * immediately after — which is why the icon appears a beat late rather than
   * flickering through the wrong one.
   */
  getServerSnapshot(): null {
    return null;
  },
};

export function ThemeToggle() {
  const showing = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  function pick(next: "light" | "dark") {
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event(THEME_EVENT));

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not remembering the choice is survivable; failing to apply it is not,
      // and that already happened on the line above.
    }
  }

  // Before hydration `showing` is null: the button renders its frame but no
  // icon, which is less jarring than the layout shifting once it arrives.
  const next = showing === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => pick(next)}
      aria-label={showing ? `Switch to the ${next} theme` : "Switch theme"}
      title={showing ? `Switch to the ${next} theme` : "Switch theme"}
      className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
    >
      {showing === "light" ? <MoonIcon /> : showing === "dark" ? <SunIcon /> : null}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  );
}
