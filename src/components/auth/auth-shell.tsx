import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand";
import { cn } from "@/components/ui";

/**
 * The frame every authentication page sits in.
 *
 * All four of these pages are the same object — a brand mark, one short
 * promise, one card, one way out at the bottom — and they were drifting apart
 * one heading at a time. Putting the frame here means adding a fifth page is a
 * matter of writing its form.
 *
 * The card is the only lifted surface on the page and it is deliberately
 * narrow. Someone arrives here mid-task, usually from a link a stranger sent
 * them, and the job is to make the form the only thing there is to do.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  aside,
  width = "md",
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Under the card — the "no account yet?" line. */
  footer?: ReactNode;
  /** Under the footer, quieter. Reassurance, not navigation. */
  aside?: ReactNode;
  width?: "md" | "lg";
}) {
  return (
    <div className="relative isolate mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center py-6 sm:py-10">
      <AuthBackdrop />

      <div className={cn("mx-auto w-full", width === "lg" ? "max-w-lg" : "max-w-md")}>
        <header className="auth-enter mb-6 text-center" style={{ "--enter-delay": "0ms" } as never}>
          {/* The mark, not the full lockup: the wordmark is already in the
              header directly above, and printing the brand twice in 80px of
              vertical space reads as a template rather than a page. */}
          <Link
            href="/"
            aria-label="PESescrow.com — home"
            className="inline-grid place-items-center rounded-[var(--radius-control)]"
          >
            <BrandMark size={40} />
          </Link>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]">
            {title}
          </h1>

          {subtitle ? (
            <p className="mx-auto mt-2 max-w-sm text-pretty text-sm text-[var(--muted)]">
              {subtitle}
            </p>
          ) : null}
        </header>

        <div
          className="auth-enter rounded-[var(--radius-panel)] border border-[var(--glass-border)] bg-[var(--glass-panel)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl backdrop-saturate-150 sm:p-7"
          style={{ "--enter-delay": "70ms" } as never}
        >
          {children}
        </div>

        {footer ? (
          <div
            className="auth-enter mt-5 text-center text-sm text-[var(--muted)]"
            style={{ "--enter-delay": "140ms" } as never}
          >
            {footer}
          </div>
        ) : null}

        {aside ? (
          <div
            className="auth-enter mt-6 text-center text-xs leading-relaxed text-[var(--faint)]"
            style={{ "--enter-delay": "200ms" } as never}
          >
            {aside}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A single emerald bloom behind the card.
 *
 * Purely decorative, so it is aria-hidden and cannot be hit. Kept to one soft
 * shape: these pages are read under stress — locked out, or deciding whether to
 * trust the site with a trade — and a busy background reads as a phishing page.
 */
function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--tone-success-bg), transparent 70%)",
        }}
      />
      <div className="texture-grid absolute inset-0 opacity-50" />
    </div>
  );
}
