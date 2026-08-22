import Link from "next/link";
import type { ReactNode } from "react";

import { NavIcon, type NavIconName } from "@/components/nav/nav-icons";
import { Alert } from "@/components/ui";
import { SITE } from "@/lib/site";
import { RECOVERY_COPY } from "@/lib/auth-copy";
import type { Locale } from "@/lib/locale";

/**
 * Why there is no reset form.
 *
 * Both /forgot-password and /reset-password have to lead with this, and they
 * were leading with two near-identical paragraphs. One wording, so the promise
 * cannot end up softer on one page than the other.
 */
export function NoResetNotice({ locale = "en" }: { locale?: Locale }) {
  const copy = RECOVERY_COPY[locale];

  return (
    <Alert tone="warning" title={copy.noticeTitle}>
      {copy.noticeBody}
    </Alert>
  );
}

/**
 * The ways back into an account, in the order to try them.
 *
 * Shared by /forgot-password and /reset-password: both are read by the same
 * person in the same state, and the answer must not differ depending on which
 * one they happened to land on.
 *
 * Ordered by how quickly they work rather than how common they are — a recovery
 * code gets you in this minute, everything else takes a human.
 */
export function RecoveryRoutes({ locale = "en" }: { locale?: Locale }) {
  const copy = RECOVERY_COPY[locale];

  return (
    <ol className="space-y-2">
      <Route
        step={1}
        icon="shield"
        title={copy.step1Title}
        action={{ href: "/login", label: copy.step1Action }}
      >
        {copy.step1Body}
      </Route>

      <Route
        step={2}
        icon="mail"
        title={copy.step2Title}
        action={{ href: "/contact", label: copy.step2Action }}
      >
        {copy.step2Body}
        {SITE.supportEmail ? ` — ${SITE.supportEmail}` : ""}. {copy.step2BodyTail}
      </Route>

      <Route step={3} icon="help" title={copy.step3Title}>
        {copy.step3Body}
      </Route>
    </ol>
  );
}

function Route({
  step,
  icon,
  title,
  action,
  children,
}: {
  step: number;
  icon: NavIconName;
  title: string;
  action?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] p-3">
      <span
        aria-hidden="true"
        className="mt-px grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--accent)]"
      >
        <NavIcon name={icon} />
      </span>

      <div className="min-w-0">
        <h2 className="text-sm font-semibold">
          {/* The number is decorative — the list already conveys order to a
              screen reader, and reading "1." before every heading is noise. */}
          <span aria-hidden="true" className="text-[var(--muted)]">
            {step}.
          </span>{" "}
          {title}
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{children}</p>

        {action ? (
          <Link
            href={action.href}
            className="mt-2 inline-flex min-h-9 items-center text-xs font-medium text-[var(--accent)] hover:underline"
          >
            {action.label} →
          </Link>
        ) : null}
      </div>
    </li>
  );
}
