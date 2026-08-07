"use client";

import { useTransition } from "react";

import { setLocaleAction } from "@/app/actions/locale-actions";
import { Menu, MenuRow } from "@/components/nav/menu";
import { cn } from "@/components/ui";
import { LOCALE_NAME, LOCALES, type Locale } from "@/lib/locale";

/**
 * The language switcher.
 *
 * Reuses the same Menu primitive as the nav dropdowns and the profile menu, so
 * it gets the outside-click, Escape, arrow keys and aria wiring for free rather
 * than being a fourth popover implementation.
 *
 * The trigger is the globe plus the *current* language's own name — "العربية",
 * not "Arabic". An endonym is what a speaker scans for, and it also means the
 * button says something useful before you open it.
 */
export function LanguageMenu({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();

  return (
    <Menu
      label="Change language"
      align="end"
      panelClassName="w-44"
      triggerClassName={cn(
        "flex items-center gap-1.5 rounded-[var(--radius-control)] px-2 py-2 text-sm transition-colors",
        "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
        pending && "opacity-60",
      )}
      trigger={() => (
        <>
          <GlobeIcon />
          {/* The name is for people with room for it; the globe and the
              aria-label carry the meaning everywhere else. */}
          <span className="hidden sm:inline">{LOCALE_NAME[locale]}</span>
        </>
      )}
    >
      {LOCALES.map((option) => {
        const selected = option === locale;

        return (
          <MenuRow
            key={option}
            as="button"
            type="button"
            variant="compact"
            // aria-checked, not aria-current: this is a choice between
            // alternatives, not a link to where you already are.
            role="menuitemradio"
            aria-checked={selected}
            lang={option}
            onClick={() => startTransition(() => setLocaleAction(option))}
            icon={selected ? <TickIcon /> : <span className="size-4" />}
            title={LOCALE_NAME[option]}
            className={selected ? "font-medium text-[var(--accent)]" : undefined}
          />
        );
      })}
    </Menu>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17" />
      {/* The meridian, which is what stops this reading as a football. */}
      <path d="M12 3a14 14 0 000 18a14 14 0 000-18z" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4.5 4.5L19 7" />
    </svg>
  );
}
