import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { getConsoleStats, listDealsForAdmin } from "@/lib/admin";
import { listStalledCodeRequests } from "@/lib/transfer-codes";
import { countPendingApplications } from "@/lib/promoters";
import { adminSections } from "@/components/dashboard/dash-nav";
import { adminDealColumns } from "@/components/dashboard/admin-deal-columns";
import { Breakdown } from "@/components/dashboard/breakdown";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { RatioBar } from "@/components/dashboard/ratio-bar";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Card, SetupProblem } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { ADMIN_HUB } from "@/lib/page-copy";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  // Non-admins get a 404 rather than a "forbidden" page, so this route does not
  // advertise its existence.
  const auth = await requireUserOrProblem(["admin"], "/admin");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const admin = auth.user;
  const now = new Date();
  const locale = await getLocale();
  const copy = ADMIN_HUB[locale];

  const [stats, queue, stalledCodes, pendingApplications] = await Promise.all([
    getConsoleStats(now),
    listDealsForAdmin("needs_action", "", now),
    listStalledCodeRequests(),
    countPendingApplications(),
  ]);

  // In-flight deals sitting in one of the admin's own queues. Used for the
  // rates below; the three are mutually exclusive statuses, so they add up
  // without double-counting a deal.
  const blockedOnAdmin =
    stats.paymentsToConfirm + stats.deliveriesToApprove + stats.openDisputes;

  // Ordered by how much it matters if you ignore it.
  const queues = [
    {
      label: copy.openDisputes,
      value: stats.openDisputes,
      href: "/admin/disputes",
      icon: "scales" as const,
      caption: copy.openDisputesCaption,
    },
    {
      label: copy.promoterApplications,
      value: pendingApplications,
      href: "/admin/promoters",
      icon: "inbox" as const,
      caption: copy.promoterApplicationsCaption,
    },
    {
      label: copy.paymentsToConfirm,
      value: stats.paymentsToConfirm,
      href: "/admin/deals?filter=payment_submitted",
      icon: "wallet" as const,
      caption: copy.paymentsToConfirmCaption,
    },
    {
      label: copy.deliveriesToApprove,
      value: stats.deliveriesToApprove,
      href: "/admin/deals?filter=admin_verifying",
      icon: "shield" as const,
      caption: copy.deliveriesToApproveCaption,
    },
    {
      label: copy.withdrawalsToSend,
      value: stats.withdrawalsToSend,
      href: "/admin/withdrawals",
      icon: "payout" as const,
      caption: copy.withdrawalsToSendCaption,
    },
    {
      label: copy.buyersGoneQuiet,
      value: stats.buyersGoneQuiet,
      href: "/admin/deals?filter=claiming",
      icon: "route" as const,
      caption: copy.buyersGoneQuietCaption,
    },
    {
      // Not a status filter: a stalled code can sit on a released deal or a
      // claiming one, so it gets its own list below.
      label: copy.sellersOwingCode,
      value: stats.codesAwaitingSeller,
      href: "#codes",
      icon: "ticket" as const,
      caption: copy.sellersOwingCodeCaption,
    },
  ];

  return (
    <DashShell
      groups={adminSections({
        deals: queue.length,
        withdrawals: stats.withdrawalsToSend,
        disputes: stats.openDisputes,
        promoters: pendingApplications,
      })}
      title={copy.title}
      description={copy.signedInAs(admin.email)}
    >
      <h2 className="mb-3 text-sm font-semibold">{copy.waitingOnYou}</h2>

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
          title={copy.whatQueuesLookLike}
          caption={copy.queuesShare}
          segments={[
            { label: copy.openDisputes, value: stats.openDisputes, tone: "danger" },
            { label: copy.paymentsToConfirm, value: stats.paymentsToConfirm, tone: "warning" },
            { label: copy.deliveriesToApprove, value: stats.deliveriesToApprove, tone: "info" },
            { label: copy.withdrawalsToSend, value: stats.withdrawalsToSend, tone: "success" },
            { label: copy.buyersGoneQuiet, value: stats.buyersGoneQuiet, tone: "warning" },
            { label: copy.sellersOwingCode, value: stats.codesAwaitingSeller, tone: "neutral" },
          ]}
          emptyLabel={copy.everyQueueEmpty}
        />

        <StatGrid columns={3}>
          <StatCard
            label={copy.dealsInFlight}
            value={stats.dealsInFlight}
            caption={copy.notYetSettled}
            icon="folder"
            href="/admin/deals?filter=open"
          />
          <StatCard
            label={copy.users}
            value={stats.users}
            caption={copy.registeredAccounts}
            icon="users"
            href="/admin/users"
          />
          <StatCard
            label={copy.banned}
            value={stats.bannedUsers}
            caption={copy.blockedFromTrading}
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
          {copy.howThingsAreRunning}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <RatioBar
            label={copy.dealsRunningWithoutYou}
            value={Math.max(0, stats.dealsInFlight - blockedOnAdmin)}
            of={stats.dealsInFlight}
            caption={copy.restInQueues}
          />
          <RatioBar
            label={copy.inFlightDisputed}
            value={stats.openDisputes}
            of={stats.dealsInFlight}
            invert
            caption={copy.disputeFreezes}
          />
          <RatioBar
            label={copy.accountsInGoodStanding}
            value={Math.max(0, stats.users - stats.bannedUsers)}
            of={stats.users}
            caption={copy.bannedCannot}
          />
          <RatioBar
            label={copy.sellersAnswered}
            value={Math.max(0, stats.dealsInFlight - stats.codesAwaitingSeller)}
            of={stats.dealsInFlight}
            caption={copy.buyerCannotFinish}
          />
        </div>
      </section>

      {stalledCodes.length > 0 ? (
        <section id="codes" className="mt-8 scroll-mt-20">
          <h2 className="mb-1 text-sm font-semibold">{copy.waitingOnKonami}</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">{copy.waitingOnKonamiBody}</p>

          <ul className="space-y-2">
            {stalledCodes.map((request) => (
              <li key={request.id}>
                <Link href={`/admin/deals/${request.deal.id}`} className="block">
                  <Card className="p-4 transition-colors hover:border-[var(--accent)]/40">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-sm">{request.deal.reference}</span>
                      <span className="text-xs text-[var(--tone-warning)]">
                        {copy.asked} {request.requestedAt.toLocaleString(locale === "ar" ? "ar" : "en-GB")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {request.deal.buyer?.displayName ?? "—"} {copy.isWaitingOn}{" "}
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
        <h2 className="text-sm font-semibold">{copy.needsAttention}</h2>
        <Link href="/admin/deals" className="text-xs text-[var(--accent)] hover:underline">
          {copy.allDeals}
        </Link>
      </div>

      <DataTable
        caption={copy.dealsNeedingDecision}
        rows={queue}
        rowKey={(deal) => deal.id}
        rowHref={(deal) => `/admin/deals/${deal.id}`}
        columns={adminDealColumns(now, locale)}
        empty={
          <EmptyPanel icon="shield" title={copy.nothingWaitingTitle} tone="positive">
            {copy.nothingWaitingBody}
          </EmptyPanel>
        }
      />
    </DashShell>
  );
}
