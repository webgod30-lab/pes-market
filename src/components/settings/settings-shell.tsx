import type { ReactNode } from "react";

import { traderSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { Avatar } from "@/components/nav/identity";
import { Badge } from "@/components/ui";
import type { Role } from "@/generated/prisma/client";

/**
 * The frame for the settings area.
 *
 * There is one settings page today — security — and it was a bare heading with
 * two cards under it. Giving it the same rail as the rest of the signed-in area
 * matters for a plain reason: it was previously a dead end, reachable only from
 * the profile menu and offering one link back to the dashboard.
 *
 * The identity strip is not decoration either. Every account on this service is
 * reached by the same email-and-password form, and an admin acting on the wrong
 * one can release credentials or approve a payout. Saying which account these
 * settings belong to, at the top of the page that changes them, is cheap.
 */
export function SettingsShell({
  user,
  title,
  description,
  children,
}: {
  user: { displayName: string; email: string; role: Role };
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DashShell groups={traderSections({})} title={title} description={description}>
      <div className="max-w-2xl">
        <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-3">
          <Avatar name={user.displayName} size="lg" />

          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <span className="truncate">{user.displayName}</span>
              {user.role === "admin" ? <Badge tone="warning">admin</Badge> : null}
            </p>
            <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
          </div>
        </div>

        {children}
      </div>
    </DashShell>
  );
}

/**
 * One setting, with its own heading and explanation.
 *
 * `tone` lets a section say it is unfinished without shouting — the password
 * section is genuinely not built yet, and dressing that up as an equal peer of
 * working two-factor would be misleading.
 */
export function SettingsSection({
  title,
  description,
  children,
  tone = "normal",
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  tone?: "normal" | "muted";
}) {
  return (
    <section
      className={
        tone === "muted"
          ? "mb-3 rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-[var(--surface)]/40 p-5 last:mb-0"
          : "mb-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 last:mb-0"
      }
    >
      <h2 className="text-sm font-semibold">{title}</h2>

      {description ? (
        <div className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{description}</div>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
