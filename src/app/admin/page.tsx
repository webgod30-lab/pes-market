import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { getConsoleStats, listDealsForAdmin } from "@/lib/admin";
import { listStalledCodeRequests } from "@/lib/transfer-codes";
import { defaultFeeBps, formatFeeBps } from "@/lib/fees";
import { AdminNav } from "@/components/admin-nav";
import { AdminDealRow } from "@/components/admin-deal-row";
import { Card, EmptyState, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Admin — PES Escrow" };

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

  const feeBps = defaultFeeBps();

  // Ordered by how much it matters if you ignore it.
  const queues = [
    { label: "Open disputes", value: stats.openDisputes, href: "/admin/disputes" },
    { label: "Payments to confirm", value: stats.paymentsToConfirm, href: "/admin/deals?filter=payment_submitted" },
    { label: "Deliveries to approve", value: stats.deliveriesToApprove, href: "/admin/deals?filter=admin_verifying" },
    { label: "Withdrawals to send", value: stats.withdrawalsToSend, href: "/admin/withdrawals" },
    { label: "Buyers gone quiet", value: stats.buyersGoneQuiet, href: "/admin/deals?filter=claiming" },
    // Not a status filter: a stalled code can sit on a released deal or a
    // claiming one, so it gets its own list below.
    { label: "Sellers owing a code", value: stats.codesAwaitingSeller, href: "#codes" },
  ];

  const context = [
    { label: "Deals in flight", value: stats.dealsInFlight, href: "/admin/deals?filter=open" },
    { label: "Users", value: stats.users, href: "/admin/users" },
    { label: "Banned", value: stats.bannedUsers, href: "/admin/users" },
  ];

  return (
    <div>
      <PageHeading
        title="Admin console"
        description={`Signed in as ${admin.email}. No money and no credentials move without you. Fee: ${formatFeeBps(feeBps)}.`}
      />

      <AdminNav current="hub" />

      <h2 className="mb-3 text-sm font-semibold">Waiting on you</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {queues.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block">
            <Card className="p-4 transition-colors hover:border-emerald-500/40">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{stat.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${stat.value > 0 ? "text-[var(--tone-warning)]" : ""}`}>
                {stat.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {context.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block">
            <Card className="p-4 transition-colors hover:border-emerald-500/40">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {stalledCodes.length > 0 ? (
        <section id="codes" className="mt-8 scroll-mt-4">
          <h2 className="mb-1 text-sm font-semibold">Buyers waiting on a Konami code</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">
            The buyer has paid and cannot finish the transfer. Only the seller can answer — chase
            them, oldest first.
          </p>
          <ul className="space-y-2">
            {stalledCodes.map((request) => (
              <li key={request.id}>
                <Link href={`/admin/deals/${request.deal.id}`} className="block">
                  <Card className="p-4 transition-colors hover:border-emerald-500/40">
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

      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Needs your attention</h2>
        <Link href="/admin/deals" className="text-xs text-[var(--accent)] hover:underline">
          All deals →
        </Link>
      </div>

      {queue.length === 0 ? (
        <EmptyState>Nothing waiting on you.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {queue.map((deal) => (
            <li key={deal.id}>
              <AdminDealRow deal={deal} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
