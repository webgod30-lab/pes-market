"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";

import { cn } from "@/components/ui";

/**
 * One dropdown, used by every dropdown.
 *
 * The nav's "Resources" menu and the profile menu need the same seven things —
 * toggle, close on outside click, close on Escape with focus returned, arrow
 * keys between items, Home/End, correct aria wiring, close on navigation — and
 * writing that twice is how the two end up behaving differently by accident.
 *
 * Two decisions worth stating:
 *
 * The panel is never unmounted. It stays in the DOM and is closed with `inert`,
 * which takes its items out of the tab order, out of the accessibility tree and
 * out of hit-testing exactly as removal would — but leaves something for CSS to
 * transition on the way out. Unmounting gives you a closing animation only if
 * you also keep a "still closing" state and guess when it ends.
 *
 * `inert` rather than `visibility: hidden` because opening has to make the
 * items focusable *synchronously*. `visibility` is a transitioned property, so
 * its computed value only flips once the transition starts, which is a frame
 * later than the keyboard handler below needs it.
 *
 * It opens on click, not on hover. Hover menus are unusable on touch, fire
 * constantly when the pointer crosses the bar on the way somewhere else, and
 * need a hover-intent delay to feel right. Click behaves the same for a mouse,
 * a finger and a keyboard.
 */
export function Menu({
  label,
  trigger,
  children,
  align = "start",
  panelClassName = "",
  triggerClassName = "",
}: {
  /** Accessible name for the trigger. Required — some triggers are icon-only. */
  label: string;
  /** Rendered inside the trigger button; receives the open state for chevrons. */
  trigger: (state: { open: boolean }) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
  triggerClassName?: string;
}) {
  const pathname = usePathname();
  const panelId = useId();

  // Storing which route it was opened on means a navigation closes it for free,
  // with no effect writing state during render. Same trick as the mobile sheet.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpenedOn(null);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  /** The focusable rows, read from the DOM so children can be anything. */
  const items = useCallback(
    () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
    [],
  );

  const focusItem = useCallback(
    (index: number) => {
      const all = items();
      if (all.length === 0) return;
      // Wrap, so ArrowUp from the top lands on the last row.
      all[(index + all.length) % all.length]?.focus();
    },
    [items],
  );

  // Outside click and Escape. Bound only while open, and on pointerdown rather
  // than click so a press that starts outside dismisses immediately.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenedOn(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(true);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  function onTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();

    // The panel is mounted but invisible, and focus does not land on an
    // invisible element — so the class change has to be on screen before the
    // focus call. flushSync commits it synchronously, which is exactly what
    // this needs; deferring to a frame would work most of the time and fail
    // whenever the browser is not painting.
    flushSync(() => setOpenedOn(pathname));
    focusItem(event.key === "ArrowDown" ? 0 : -1);
  }

  function onPanelKeyDown(event: React.KeyboardEvent) {
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(at + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(at - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(-1);
    } else if (event.key === "Tab") {
      // Tabbing out of a menu closes it, without hijacking where focus goes.
      setOpenedOn(null);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenedOn(open ? null : pathname)}
        onKeyDown={onTriggerKeyDown}
        className={triggerClassName}
      >
        {trigger({ open })}
      </button>

      <div
        ref={panelRef}
        id={panelId}
        role="menu"
        aria-label={label}
        inert={!open}
        onKeyDown={onPanelKeyDown}
        // Delegated: any row that navigates or submits should also dismiss.
        // Catching it here means every menu gets it without each row wiring up
        // its own handler.
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('[role="menuitem"]')) setOpenedOn(null);
        }}
        className={cn(
          "absolute top-[calc(100%+0.5rem)] z-50 origin-top rounded-[var(--radius-panel)] p-1.5",
          "border border-[var(--glass-border)] bg-[var(--glass-panel)] shadow-[var(--shadow-lg)]",
          "backdrop-blur-xl backdrop-saturate-150",
          "transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
          align === "end" ? "end-0" : "start-0",
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0",
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A row inside a menu.
 *
 * Rendered as whatever it needs to be — a Link, a submit button — with the
 * menu semantics and the hover treatment supplied here so the two menus cannot
 * drift apart visually.
 */
export function MenuRow({
  as: Component = "div",
  variant = "rich",
  icon,
  title,
  description,
  className = "",
  ...props
}: {
  as?: React.ElementType;
  /**
   * "rich" is a destination being sold to you — a tiled icon and a line of
   * explanation, for the nav dropdowns. "compact" is a list you already know
   * your way around, so the icon is left plain and inherits the row's colour.
   * That last part matters: a tinted emerald tile next to red "Sign out" text
   * reads as two different states on one row.
   */
  variant?: "rich" | "compact";
  icon?: ReactNode;
  title: ReactNode;
  description?: string;
  className?: string;
} & Record<string, unknown>) {
  const rich = variant === "rich";

  return (
    <Component
      role="menuitem"
      className={cn(
        "group flex w-full gap-3 rounded-[var(--radius-control)] px-2.5 text-start",
        "transition-colors hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)]",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent)]",
        rich ? "items-start py-2" : "items-center py-2",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          className={cn(
            "grid shrink-0 place-items-center",
            rich
              ? "mt-px size-8 rounded-[var(--radius-control)] border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--accent)] transition-transform group-hover:scale-105"
              : "size-5 text-[var(--muted)] transition-colors group-hover:text-current",
          )}
        >
          {icon}
        </span>
      ) : null}

      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </Component>
  );
}
