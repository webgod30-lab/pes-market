"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

/** Header height (h-14 = 56px) plus its 1px bottom border. */
const HEADER_OFFSET = 57;

/**
 * The small-screen navigation.
 *
 * The open sheet is rendered through a portal into <body> rather than inline,
 * and that is not a style preference — it is required. The header carries
 * `backdrop-blur`, and an element with a backdrop-filter becomes the containing
 * block for any `position: fixed` descendant. Left inside the header, the sheet
 * resolved `top/bottom` against a 57px-tall box and rendered 33px high: opening
 * the menu appeared to do nothing at all.
 *
 * Portalling to <body> puts it back in the viewport's coordinate space.
 */
export function MobileMenu({
  links,
  footer,
}: {
  links: { href: string; label: string }[];
  /** Rendered at the bottom of the sheet — the sign-out form lives here,
   *  because the header's own sign-out button is hidden at this width. */
  footer?: ReactNode;
}) {
  const pathname = usePathname();

  // Storing *which route* the menu was opened on means a navigation closes it
  // for free, with no effect that writes state during render.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  // No "mounted" guard is needed before portalling: `open` starts false and can
  // only become true from a click, which is always after hydration, so
  // document.body is guaranteed to exist by the time the portal renders.

  // Stop the page scrolling behind the open menu.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape, which people expect from anything overlay-shaped.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOn(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sheet = (
    <div
      id="mobile-menu"
      className="fixed inset-x-0 z-50 overflow-y-auto border-t border-[var(--border)] bg-[var(--background)] px-4 py-4 md:hidden"
      style={{ top: HEADER_OFFSET, bottom: 0 }}
    >
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`rounded-lg px-3 py-3 text-base ${
              pathname === link.href
                ? "bg-emerald-500/10 font-medium text-emerald-300"
                : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {footer ? <div className="mt-4 border-t border-[var(--border)] pt-4">{footer}</div> : null}
    </div>
  );

  // Hidden from `md` up, which is exactly where the header's own nav appears.
  // Using `sm` here would leave 640-767px with no navigation at all.
  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-9 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"
      >
        {/* Two bars that become an X, rather than shipping an icon library. */}
        <span className="relative block h-3 w-4">
          <span
            className={`absolute left-0 block h-0.5 w-4 bg-current transition-transform ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-4 bg-current transition-transform ${
              open ? "top-1.5 -rotate-45" : "top-3"
            }`}
          />
        </span>
      </button>

      {open ? createPortal(sheet, document.body) : null}
    </div>
  );
}
