import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { getConsoleStats, listDealsForAdmin } from "@/lib/admin";
import { listStalledCodeRequests } from "@/lib/transfer-codes";
import { adminSections } from "@/components/dashboard/dash-nav";
import { adminDealColumns } from "@/components/dashboard/admin-deal-columns";
import { Breakdown } from "@/components/dashboard/breakdown";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { RatioBar } from "@/components/dashboard/ratio-bar";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Card, SetupProblem } from "@/components/ui";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  // Non-admins get a 404 rather than a "forbidden" page, so this route does not
  // advertise its existence.
  const auth = await requireUserOrProblem(["admin"], "/admin");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const admin = auth.user;
  const now = new Date();

  const [stats, queue, stalledCodes] = await Promise.all([
    getConsoleStats(now),
    listDealsForAdmin("needs_action", "", now),
    listStalledCodeRequests(),
  ]);

  // In-flight deals sitting in one of the admin's own queues. Used for the
  // rates below; the three are mutually exclusive statuses, so they add up
  // without double-counting a deal.
  const blockedOnAdmin =
    stats.paymentsToConfirm + stats.deliveriesToApprove + stats.openDisputes;

  // Ordered by how much it matters if you ignore it.
  const queues = [
    {
      label: "Open disputes",
      value: stats.openDisputes,
      href: "/admin/disputes",
      icon: "scales" as const,
      caption: "frozen until you decide",
    },
    {
      label: "Payments to confirm",
      value: stats.paymentsToConfirm,
      href: "/admin/deals?filter=payment_submitted",
      icon: "wallet" as const,
      caption: "buyer says they have paid",
    },
    {
      label: "Deliveries to approve",
      value: stats.deliveriesToApprove,
      href: "/admin/deals?filter=admin_verifying",
      icon: "shield" as const,
      caption: "check the account first",
    },
    {
      label: "Withdrawals to send",
      value: stats.withdrawalsToSend,
      href: "/admin/withdrawals",
      icon: "payout" as const,
      caption: "money reserved, not yet gone",
    },
    {
      label: "Buyers gone quiet",
      value: stats.buyersGoneQuiet,
      href: "/admin/deals?filter=claiming",
      icon: "route" as const,
      caption: "past the confirmation window",
    },
    {
      // Not a status filter: a stalled code can sit on a released deal or a
      // claiming one, so it gets its own list below.
      label: "Sellers owing a code",
      value: stats.codesAwaitingSeller,
      href: "#codes",
      icon: "ticket" as const,
      caption: "buyer cannot finish without it",
    },
  ];

  return (
    <DashShell
      groups={adminSections({
        deals: queue.length,
        withdrawals: stats.withdrawalsToSend,
        disputes: stats.openDisputes,
      })}
      title="Admin console"
      description={
        <>
          Signed in as {admin.email}. No credentials move without you. Swaps are free — the only
          money leaving is $2 a deal to promoters, paid on the 1st.
        </>
      }
    >
      <h2 className="mb-3 text-sm font-semibold">Waiting on you</h2>

      <StatGrid columns={3}>
        {queues.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            caption={item.caption}
            icon={item.icon}
            href={item.href}
            urgent
          />
        ))}
      </StatGrid>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <Breakdown
          title="What the queues look like"
          caption="The same six numbers above, as a share of everything waiting."
          segments={[
            { label: "Open disputes", value: stats.openDisputes, tone: "danger" },
            { label: "Payments to confirm", value: stats.paymentsToConfirm, tone: "warning" },
            { label: "Deliveries to approve", value: stats.deliveriesToApprove, tone: "info" },
            { label: "Withdrawals to send", value: stats.withdrawalsToSend, tone: "success" },
            { label: "Buyers gone quiet", value: stats.buyersGoneQuiet, tone: "warning" },
            { label: "Sellers owing a code", value: stats.codesAwaitingSeller, tone: "neutral" },
          ]}
          emptyLabel="Every queue is empty. Nothing is waiting on you."
        />

        <StatGrid columns={3}>
          <StatCard
            label="Deals in flight"
            value={stats.dealsInFlight}
            caption="not yet settled"
            icon="folder"
            href="/admin/deals?filter=open"
          />
          <StatCard
            label="Users"
            value={stats.users}
            caption="registered accounts"
            icon="users"
            href="/admin/users"
          />
          <StatCard
            label="Banned"
            value={stats.bannedUsers}
            caption="blocked from trading"
            icon="shield"
            href="/admin/users"
          />
        </StatGrid>
      </div>

      {/* Rates, not counts. Six numbers tell you the volume of work; these tell
          you whether the service is healthy — and all four come from the stats
          already counted above, with no extra query. */}
      <section
        aria-labelledby="rates-heading"
        className="mt-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <h2 id="rates-heading" className="text-sm font-semibold">
          How things are running
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <RatioBar
            label="Deals running without you"
            value={Math.max(0, stats.dealsInFlight - blockedOnAdmin)}
            of={stats.dealsInFlight}
            caption="The rest are sitting in one of your queues."
          />
          <RatioBar
            label="In-flight deals disputed"
            value={stats.openDisputes}
            of={stats.dealsInFlight}
            invert
            caption="A dispute freezes its deal until you decide it."
          />
          <RatioBar
            label="Accounts in good standing"
            value={Math.max(0, stats.users - stats.bannedUsers)}
            of={stats.users}
            caption="Banned accounts cannot open or join a deal."
          />
          <RatioBar
            label="Sellers who have answered a code request"
            value={Math.max(0, stats.dealsInFlight - stats.codesAwaitingSeller)}
            of={stats.dealsInFlight}
            caption="A buyer cannot finish a transfer without it."
          />
        </div>
      </section>

      {stalledCodes.length > 0 ? (
        <section id="codes" className="mt-8 scroll-mt-20">
          <h2 className="mb-1 text-sm font-semibold">Buyers waiting on a Konami code</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">
            The buyer has paid and cannot finish the transfer. Only the seller can answer — chase
            them, oldest first.
          </p>

          <ul className="space-y-2">
            {stalledCodes.map((request) => (
              <li key={request.id}>
                <Link href={`/admin/deals/${request.deal.id}`} className="block">
                  <Card className="p-4 transition-colors hover:border-[var(--accent)]/40">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-sm">{request.deal.reference}</span>
                      <span className="text-xs text-[var(--tone-warning)]">
                        asked {request.requestedAt.toLocaleString("en-GB")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {request.deal.buyer?.displayName ?? "—"} is waiting on{" "}
                      {request.deal.seller?.displayName ?? "—"}
                    </p>
                    {request.requestNote ? (
                      <p className="mt-1.5 text-sm">{request.requestNote}</p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Needs your attention</h2>
        <Link href="/admin/deals" className="text-xs text-[var(--accent)] hover:underline">
          All deals →
        </Link>
      </div>

      <DataTable
        caption="Deals needing an admin decision"
        rows={queue}
        rowKey={(deal) => deal.id}
        rowHref={(deal) => `/admin/deals/${deal.id}`}
        columns={adminDealColumns(now)}
        empty={
          <EmptyPanel icon="shield" title="Nothing waiting on you" tone="positive">
            No payments to confirm, no deliveries to approve and no disputes open. Deals still in
            flight are waiting on the two parties, not on you.
          </EmptyPanel>
        }
      />
    </DashShell>
  );
}
