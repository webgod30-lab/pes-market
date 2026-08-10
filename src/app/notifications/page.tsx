import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listDealsForUser } from "@/lib/deals";
import { unreadCountForUser } from "@/lib/messages";
import { isTurnOf } from "@/lib/deal-status";
import { traderSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { NavIcon, type NavIconName } from "@/components/nav/nav-icons";
import { StatusBadge } from "@/components/trade/status-badge";
import { cn, SetupProblem } from "@/components/ui";
import type { DealStatus } from "@/generated/prisma/client";

export const metadata = { title: "Notifications" };

// Reads the signed-in user's deals, so it can never be prerendered.
export const dynamic = "force-dynamic";

type DealRow = Awaited<ReturnType<typeof listDealsForUser>>[number];

/**
 * What needs you.
 *
 * There is no Notification table and this service sends no email, so nothing
 * here is a stored, dismissible message — it is the current state of your deals,
 * read fresh on every load and phrased as the thing you have to do about it.
 *
 * That is a real constraint and worth being straight about rather than dressing
 * a derived list up as an inbox: there is no unread state to clear, no history
 * of past notifications, and if you fix the underlying thing the item simply
 * stops appearing. What it does give you is the one thing an escrow user
 * actually needs — a single place that answers "is anything waiting on me",
 * without opening every deal to find out.
 *
 * Derived entirely from the two calls the dashboard already makes. No new query.
 */
export default async function NotificationsPage() {
  const auth = await requireUserOrProblem(null, "/notifications");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const user = auth.user;

  const [deals, unread] = await Promise.all([
    listDealsForUser(user.id),
    unreadCountForUser(user.id),
  ]);

  const sideOf = (deal: DealRow) => (deal.sellerId === user.id ? "seller" : "buyer");

  // Ordered by how much it costs to ignore: frozen money first, then your move,
  // then things merely waiting on somebody else.
  const disputed = deals.filter((deal) => deal.status === "disputed");
  const yourTurn = deals.filter(
    (deal) => deal.status !== "disputed" && isTurnOf(deal.status, sideOf(deal), deal.tradeKind),
  );
  const awaitingJoin = deals.filter((deal) => deal.status === "awaiting_counterparty");

  const total = disputed.length + yourTurn.length + (unread > 0 ? 1 : 0);

  return (
    <DashShell
      groups={traderSections({ waiting: yourTurn.length })}
      title="Notifications"
      description={
        total === 0
          ? "Nothing is waiting on you."
          : `${total} thing${total === 1 ? "" : "s"} want your attention.`
      }
    >
      {total === 0 && awaitingJoin.length === 0 ? (
        <EmptyPanel icon="inbox" title="You are all caught up" tone="positive">
          No deal is waiting on you, nothing is frozen, and there are no unread messages. Anything
          still running is waiting on the other person or on the admin.
        </EmptyPanel>
      ) : (
        <div className="space-y-2">
          {disputed.map((deal) => (
            <Item
              key={deal.id}
              href={`/deals/${deal.id}`}
              icon="scales"
              tone="danger"
              title={`${deal.reference} is frozen by a dispute`}
              body="Nothing moves — no credentials, no payout — until the admin decides it. Anything you can add to the record helps."
              status={deal.status}
              side={sideOf(deal)}
            />
          ))}

          {unread > 0 ? (
            <Item
              href="/dashboard"
              icon="mail"
              tone="warning"
              title={`${unread} unread message${unread === 1 ? "" : "s"}`}
              // Deliberately not per-deal: the count available here is a total,
              // and inventing a breakdown from it would be a guess.
              body="Across all your deals. Open the deal to read them — messages on a deal are part of its record."
            />
          ) : null}

          {yourTurn.map((deal) => (
            <Item
              key={deal.id}
              href={`/deals/${deal.id}`}
              icon="route"
              tone="warning"
              title={`${deal.reference} — ${ACTION[deal.status] ?? "your move"}`}
              body={deal.accountSummary}
              status={deal.status}
              side={sideOf(deal)}
            />
          ))}

          {awaitingJoin.map((deal) => (
            <Item
              key={deal.id}
              href={`/deals/${deal.id}`}
              icon="ticket"
              tone="neutral"
              title={`${deal.reference} is waiting for the other person`}
              body="Send them the invite code from the deal page. Nothing happens until they join."
              status={deal.status}
              side={sideOf(deal)}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
        This page is built from the current state of your deals, not from stored alerts — there is
        nothing to mark as read, and items disappear once the thing they describe is done. This
        service does not send email; see{" "}
        <Link href="/faq" className="text-[var(--accent)] hover:underline">
          the FAQ
        </Link>{" "}
        for what that means if you go quiet mid-deal.
      </p>
    </DashShell>
  );
}

/** What "your turn" concretely means, per status. */
const ACTION: Partial<Record<DealStatus, string>> = {
  awaiting_credentials: "deposit the account",
  awaiting_payment: "pay into escrow",
  credentials_released: "claim the account",
  claiming: "confirm you have it",
};

const TONE_RING: Record<string, string> = {
  danger: "border-[var(--tone-danger-border)] bg-[var(--tone-danger-bg)] text-[var(--tone-danger)]",
  warning:
    "border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] text-[var(--tone-warning)]",
  neutral: "border-[var(--border)] text-[var(--muted)]",
};

function Item({
  href,
  icon,
  tone,
  title,
  body,
  status,
  side,
}: {
  href: string;
  icon: NavIconName;
  tone: "danger" | "warning" | "neutral";
  title: string;
  body: string;
  status?: DealStatus;
  side?: "seller" | "buyer";
}) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/40"
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] border",
          TONE_RING[tone],
        )}
      >
        <NavIcon name={icon} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {status && side ? <StatusBadge status={status} side={side} size="sm" /> : null}
        </span>
        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-[var(--muted)]">
          {body}
        </span>
      </span>
    </Link>
  );
}
