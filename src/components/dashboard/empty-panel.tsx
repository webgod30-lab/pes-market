import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui";
import { NavIcon, type NavIconName } from "@/components/nav/nav-icons";

/**
 * Nothing here — and what to do about it.
 *
 * The `EmptyState` in the design system is a dashed box around whatever you
 * hand it, which is right for a small slot inside a card. It is not enough for
 * the main content of a page: a trader who has just signed up sees "No deals
 * yet" and has to work out on their own that the next move is to open one or
 * paste a code.
 *
 * So this adds the three things a full-page empty state needs — a shape to look
 * at, a sentence explaining why it is empty, and the action that fills it.
 *
 * `tone` matters more than it looks. An empty *queue* on the admin console is
 * good news and should read as calm, not as a page that failed to load; an
 * empty deal list for a new trader is an invitation. Same component, different
 * temperature.
 */
export function EmptyPanel({
  icon = "inbox",
  title,
  children,
  action,
  secondaryAction,
  tone = "neutral",
}: {
  icon?: NavIconName;
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  tone?: "neutral" | "positive";
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-[var(--surface)]/40 px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className={
          tone === "positive"
            ? "mx-auto grid size-12 place-items-center rounded-full border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--accent)]"
            : "mx-auto grid size-12 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
        }
      >
        <NavIcon name={icon} className="size-5" />
      </span>

      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>

      {children ? (
        <p className="mx-auto mt-1.5 max-w-sm text-pretty text-sm leading-relaxed text-[var(--muted)]">
          {children}
        </p>
      ) : null}

      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {action ? (
            <ButtonLink href={action.href} size="sm">
              {action.label}
            </ButtonLink>
          ) : null}
          {secondaryAction ? (
            <ButtonLink href={secondaryAction.href} variant="secondary" size="sm">
              {secondaryAction.label}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
