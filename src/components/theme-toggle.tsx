"use client";

import { useEffect, useState } from "react";

/**
 * Light / dark switch.
 *
 * Three states, not two: "system" is the default and means "keep following the
 * device". Once someone picks a side it is written to localStorage and to
 * data-theme on <html>, which beats the prefers-color-scheme media query in
 * globals.css. Clearing the choice hands control back to the device.
 */
type Choice = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "pes-escrow-theme";

/**
 * Runs before first paint, from a blocking inline script in the layout, so a
 * visitor who chose light never sees a dark frame first. Kept as a string
 * because it has to exist before React does.
 */
export const themeBootScript = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(c==="light"||c==="dark"){document.documentElement.setAttribute("data-theme",c)}}catch(e){}})()`;

function resolve(choice: Choice): "light" | "dark" {
  if (choice !== "system") return choice;

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  // Starts as "system" on both server and client so the first client render
  // matches the server's HTML; the real choice is read in the effect below.
  const [choice, setChoice] = useState<Choice>("system");
  const [mounted, setMounted] = useState(false);
  // Bumped whenever the device preference changes, purely to force a re-render
  // so the icon and label stop describing the theme the visitor already has.
  const [, setDeviceTick] = useState(0);

  useEffect(() => {
    setMounted(true);

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") setChoice(stored);
    } catch {
      // Private mode, or storage disabled. Following the device is a fine
      // outcome — it just will not be remembered.
    }
  }, []);

  // The CSS follows prefers-color-scheme on its own, but this component caches
  // the answer in a render, so without this the button would keep offering to
  // switch to the theme the visitor is already looking at.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setDeviceTick((n) => n + 1);

    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  function pick(next: "light" | "dark") {
    setChoice(next);
    document.documentElement.setAttribute("data-theme", next);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not remembering the choice is survivable; failing to apply it is not,
      // and that already happened on the line above.
    }
  }

  // Before hydration there is no way to know what the device prefers, so the
  // button renders its frame but no icon. Swapping the icon in afterwards is
  // less jarring than the layout shifting.
  const showing = mounted ? resolve(choice) : null;
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
