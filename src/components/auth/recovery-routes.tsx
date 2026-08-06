import Link from "next/link";
import type { ReactNode } from "react";

import { NavIcon, type NavIconName } from "@/components/nav/nav-icons";
import { Alert } from "@/components/ui";
import { SITE } from "@/lib/site";

/**
 * Why there is no reset form.
 *
 * Both /forgot-password and /reset-password have to lead with this, and they
 * were leading with two near-identical paragraphs. One wording, so the promise
 * cannot end up softer on one page than the other.
 */
export function NoResetNotice() {
  return (
    <Alert tone="warning" title="There is no automated reset yet.">
      This service does not send email, so it cannot send you a reset link. Recovering an account is
      done by hand, by a person. It is not fast, but it is not lost either.
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
export function RecoveryRoutes() {
  return (
    <ol className="space-y-2">
      <Route
        step={1}
        icon="shield"
        title="Lost your authenticator, but know your password"
        action={{ href: "/login", label: "Sign in with a recovery code" }}
      >
        Enter your email and password as usual. When the code is asked for, type one of the recovery
        codes you saved when you turned two-factor on — each works once, in place of a code from the
        app.
      </Route>

      <Route
        step={2}
        icon="mail"
        title="Forgotten your password"
        action={{ href: "/contact", label: "Get in touch" }}
      >
        Message us from the address on the account{SITE.supportEmail ? ` — ${SITE.supportEmail}` : ""}.
        Have a deal reference to hand if you have ever opened one; it is the fastest way to show the
        account is yours.
      </Route>

      <Route step={3} icon="help" title="A deal is waiting on you right now">
        Say so in that first message. A deal you cannot reach is not running out of time silently —
        tell us and it gets held while this is sorted.
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
