"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn, TONE_SURFACE, type Tone } from "@/components/ui/tone";

/**
 * Transient confirmations.
 *
 * Two components were each keeping their own `copied` boolean and their own
 * two-second timer to flip a button's label — the same feedback, implemented
 * twice, and invisible to anyone not looking directly at that button. This
 * replaces both.
 *
 * Deliberately a module-level store rather than a React context provider. A
 * provider would mean wrapping the root layout in a client component, which
 * would push every page in the app across the server/client boundary for the
 * sake of a toast that appears twice in the whole product. A store plus one
 * `<Toaster />` costs a single client island.
 *
 * The subscription uses `useSyncExternalStore` for the same reason the theme
 * toggle does: this state genuinely lives outside React.
 */

export type ToastTone = Extract<Tone, "success" | "danger" | "info">;

type Toast = { id: number; message: string; tone: ToastTone };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  // A new array identity every time, or useSyncExternalStore cannot tell that
  // anything changed.
  listeners.forEach((listener) => listener());
}

/** How long a message stays up. Long enough to read, short enough to ignore. */
const DISMISS_AFTER = 4000;

export function toast(message: string, tone: ToastTone = "success") {
  const id = nextId++;

  toasts = [...toasts, { id, message, tone }];
  emit();

  setTimeout(() => dismiss(id), DISMISS_AFTER);
}

export function dismiss(id: number) {
  toasts = toasts.filter((entry) => entry.id !== id);
  emit();
}

const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => toasts,
  /** Never any on the server — the first one can only come from an action. */
  getServerSnapshot: (): Toast[] => EMPTY,
};

const EMPTY: Toast[] = [];

/**
 * Mounted once, in the root layout.
 *
 * The region is `aria-live="polite"` and always present, not created when the
 * first message arrives — a live region added to the page at the same moment as
 * its content is frequently not announced at all.
 */
export function Toaster() {
  const current = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  // createPortal needs document.body, which does not exist during SSR.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

  // Escape clears everything, which is what people try when a message is
  // covering something they want to read.
  useEffect(() => {
    if (current.length === 0) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        toasts = [];
        emit();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current.length]);

  if (!hydrated) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      // Bottom on a phone, where the thumb and the eye already are; bottom-right
      // on a desktop, out of the way of the content.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {current.map((entry) => (
        <div
          key={entry.id}
          className={cn(
            "toast-enter pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-[var(--radius-control)] border px-3.5 py-2.5 text-sm shadow-[var(--shadow-lg)] backdrop-blur-xl",
            TONE_SURFACE[entry.tone],
          )}
        >
          <span className="min-w-0 flex-1">{entry.message}</span>

          <button
            type="button"
            onClick={() => dismiss(entry.id)}
            aria-label="Dismiss"
            className="-my-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-[var(--radius-control)] opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

/** Nothing to subscribe to — the snapshot only differs server vs client. */
function subscribeNever() {
  return () => {};
}
