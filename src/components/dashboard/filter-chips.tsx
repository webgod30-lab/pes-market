import Link from "next/link";

import { cn } from "@/components/ui";

/**
 * A row of filters, as links.
 *
 * Links rather than buttons because the filter belongs in the URL: the overview
 * cards link straight to a filtered list, and an admin should be able to send
 * "look at this queue" to themselves later. That also means no JavaScript is
 * involved in changing the filter.
 *
 * `aria-current="page"` rather than `aria-pressed`: these are navigation, not
 * a toggle group, and the selected one really is the page you are on.
 */
export function FilterChips({
  options,
  className = "",
}: {
  options: { label: string; href: string; active: boolean }[];
  className?: string;
}) {
  return (
    // Scrolls rather than wrapping to four rows on a phone. -mx-4/px-4 lets the
    // scrolled content run to the screen edge instead of stopping short.
    <div className={cn("-mx-4 mb-4 overflow-x-auto px-4 pb-1", className)}>
      <ul className="flex w-max gap-1.5">
        {options.map((option) => (
          <li key={option.href}>
            <Link
              href={option.href}
              aria-current={option.active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center whitespace-nowrap rounded-[var(--radius-pill)] border px-3 text-xs transition-colors",
                option.active
                  ? "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] font-medium text-[var(--tone-success)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]",
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
