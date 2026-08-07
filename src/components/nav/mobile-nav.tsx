"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/app/actions/auth-actions";
import { AuthCta } from "@/components/nav/auth-cta";
import { Identity } from "@/components/nav/identity";
import { isActive } from "@/components/nav/nav-bar";
import { NavIcon } from "@/components/nav/nav-icons";
import { mobileSections, type NavUser } from "@/components/nav/nav-links";
import { Button, cn } from "@/components/ui";
import type { Translate } from "@/lib/dictionary";

/** Resting header height (h-16 = 64px). The sheet hangs below it. */
const HEADER_HEIGHT = 64;

/**
 * The small-screen navigation.
 *
 * Two things about how this is built.
 *
 * The sheet is portalled into <body> rather than rendered inline, and that is
 * not a style preference — it is required. The header carries a backdrop-filter,
 * and an element with a backdrop-filter becomes the containing block for any
 * `position: fixed` descendant. Left inside the header, the sheet resolved
 * top/bottom against a 64px-tall box and rendered a sliver high: opening the
 * menu appeared to do nothing at all.
 *
 * Once portalled it stays mounted and is closed with `inert` — the same
 * approach as the dropdown primitive in menu.tsx, and for the same reason. An
 * unmounted element has nothing left to animate, so a closing transition needs
 * either a permanently mounted element or a "still closing" state plus a timer
 * guessing when the transition ends. `inert` takes the links out of the tab
 * order, out of the accessibility tree and out of hit-testing exactly as
 * unmounting would, and unlike `visibility` it applies instantly rather than
 * waiting for a transition to start.
 */
export function MobileNav({ user, t }: { user: NavUser | null; t: Translate }) {
  const pathname = usePathname();

  // Storing which route it was opened on means a navigation closes it for free,
  // with no effect writing state during render.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpenedOn(null), []);

  // createPortal needs document.body, which does not exist while rendering on
  // the server. Read as external state rather than a `mounted` flag set in an
  // effect: that pattern is two cascading renders and trips
  // react-hooks/set-state-in-effect. Same reasoning as the theme toggle.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

  // Stop the page scrolling behind the sheet, and put focus somewhere useful.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the panel itself rather than the first link: a screen reader then
    // announces the dialog and its label before reading the list.
    //
    // Directly, not on the next frame. Effects run after the commit that
    // removed `inert`, so the sheet is already focusable here — waiting for a
    // frame would only add a way for this to silently not happen.
    sheetRef.current?.focus();

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes; Tab is kept inside the sheet. Without the trap, tabbing runs
  // off into the page behind a full-screen overlay you cannot see.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === sheetRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const sections = mobileSections(user?.role ?? null);

  const sheet = (
    // inert on the wrapper covers the scrim and the sheet in one go. The
    // md:hidden is belt and braces: above the breakpoint the whole thing is
    // display:none, so a desktop keyboard cannot reach it either.
    <div className="md:hidden" inert={!open}>
      {/* Scrim, and the click-away target. Deliberately a div: it duplicates
          what Escape and the toggle button already do for the keyboard, so
          making it focusable would only add a stop that announces nothing. */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-[var(--background)]/50 backdrop-blur-sm",
          "transition-opacity duration-200 motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        ref={sheetRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        tabIndex={-1}
        className={cn(
          "fixed inset-x-0 z-50 overflow-y-auto overscroll-contain outline-none",
          "border-t border-[var(--glass-border)] bg-[var(--glass-panel)]",
          "backdrop-blur-xl backdrop-saturate-150",
          "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4",
          "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
          open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
        style={{ top: HEADER_HEIGHT, bottom: 0 }}
      >
        {user ? <SheetIdentity user={user} /> : null}

        {sections.map((section, sectionIndex) => (
          <section key={section.labelKey ?? "links"} className="mb-4 last:mb-0">
            {section.labelKey ? (
              <h2 className="mb-1 px-3 text-overline uppercase text-[var(--muted)]">
                {t(section.labelKey)}
              </h2>
            ) : null}

            <ul className="flex flex-col gap-0.5">
              {section.items.map((item, itemIndex) => {
                const active = isActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      // Rows arrive one after another. The delay is computed
                      // rather than staggered by a library: a flat index across
                      // sections, capped so the last row is never left waiting.
                      // Zero on the way out, so closing is one clean movement.
                      style={{
                        transitionDelay: open
                          ? `${Math.min(40 + sectionIndex * 30 + itemIndex * 25, 260)}ms`
                          : "0ms",
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-3",
                        "transition-[opacity,transform,background-color] duration-200 ease-out",
                        "motion-reduce:transition-none",
                        open ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0",
                        active
                          ? "bg-[var(--tone-success-bg)] font-medium text-[var(--tone-success)]"
                          : "text-[var(--foreground)] hover:bg-[var(--surface-2)]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] border",
                          active
                            ? "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--accent)]"
                            : "border-[var(--border)] text-[var(--muted)]",
                        )}
                      >
                        <NavIcon name={item.icon} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-base">{t(item.labelKey)}</span>
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <div className="mt-5 border-t border-[var(--border)] pt-4">
          {user ? (
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" block>
                {t("account.signOut")}
              </Button>
            </form>
          ) : (
            <AuthCta stacked t={t} />
          )}
        </div>
      </div>
    </div>
  );

  // Hidden from `md` up, which is exactly where the bar's own nav appears.
  // Using `sm` would leave 640-767px with no navigation at all.
  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpenedOn(open ? null : pathname)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className={cn(
          "grid size-9 place-items-center rounded-[var(--radius-control)] border transition-colors",
          open
            ? "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--accent)]"
            : "border-[var(--glass-border)] bg-[var(--surface-2)]/60 text-[var(--foreground)]",
        )}
      >
        {/* Two bars that become an X, rather than shipping an icon library. */}
        <span aria-hidden="true" className="relative block h-3 w-4">
          <span
            className={cn(
              "absolute start-0 block h-0.5 w-4 rounded-full bg-current",
              "transition-transform duration-200 ease-out motion-reduce:transition-none",
              open ? "top-1.5 rotate-45" : "top-0",
            )}
          />
          <span
            className={cn(
              "absolute start-0 block h-0.5 w-4 rounded-full bg-current",
              "transition-transform duration-200 ease-out motion-reduce:transition-none",
              open ? "top-1.5 -rotate-45" : "top-3",
            )}
          />
        </span>
      </button>

      {hydrated ? createPortal(sheet, document.body) : null}
    </div>
  );
}

/** Nothing to subscribe to — the snapshot only ever differs server vs client. */
function subscribeNever() {
  return () => {};
}

/** Who you are, at the top of the sheet — the bar has no room to say it. */
function SheetIdentity({ user }: { user: NavUser }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-3">
      <Identity user={user} size="lg" />
    </div>
  );
}
