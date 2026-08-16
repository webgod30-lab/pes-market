import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listApplications } from "@/lib/promoters";
import { ApplicationDecision } from "@/components/admin-application-actions";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { FilterChips } from "@/components/dashboard/filter-chips";
import { Badge, Card, Overline, SetupProblem } from "@/components/ui";
import type { PromoterApplicationStatus } from "@/generated/prisma/client";

export const metadata = { title: "Promoter applications — admin" };

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<PromoterApplicationStatus, string> = {
  pending: "Waiting on you",
  approved: "Approved",
  rejected: "Refused",
};

const STATUS_TONE: Record<PromoterApplicationStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

/**
 * Cards, not a table, for the same reason the withdrawals queue is.
 *
 * The thing being decided here is a paragraph — where this person says they
 * would promote the service — and that is the whole case. Flattening it into a
 * cell would truncate the only information the decision rests on.
 */
export default async function AdminPromotersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const auth = await requireUserOrProblem(["admin"], "/admin/promoters");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const { show } = await searchParams;
  const onlyPending = show !== "all";

  const applications = await listApplications(onlyPending);

  return (
    <DashShell
      groups={adminSections({ promoters: onlyPending ? applications.length : undefined })}
      title="Promoter applications"
      description="People asking to be let in to advertise the service. Approving creates an account that can share a code and collect earnings, but cannot trade."
    >
      <FilterChips
        options={[
          { label: "Waiting on you", href: "/admin/promoters", active: onlyPending },
          { label: "Everything", href: "/admin/promoters?show=all", active: !onlyPending },
        ]}
      />

      {applications.length === 0 ? (
        onlyPending ? (
          <EmptyPanel icon="inbox" title="No applications waiting" tone="positive">
            Nobody is waiting to hear back. Applications arrive from{" "}
            <Link href="/promote" className="underline">
              /promote
            </Link>
            , which is the only way onto this site without somebody&apos;s code.
          </EmptyPanel>
        ) : (
          <EmptyPanel icon="inbox" title="No applications yet">
            Nobody has applied at{" "}
            <Link href="/promote" className="underline">
              /promote
            </Link>{" "}
            yet. Link it wherever you talk to people who might promote the service.
          </EmptyPanel>
        )
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => (
            <li key={application.id}>
              <Card elevation="raised">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">{application.displayName}</p>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">{application.email}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone={STATUS_TONE[application.status]}>
                      {STATUS_LABEL[application.status]}
                    </Badge>
                    <span className="text-xs text-[var(--muted)]">
                      applied {application.createdAt.toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>

                {/* The case itself. Everything above is identification; this is
                    the only part worth reading twice. */}
                <div className="mt-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
                  <Overline>Where they would promote it</Overline>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
                    {application.channel}
                  </p>
                </div>

                {application.decisionNote ? (
                  <p className="mt-2 text-sm">
                    <span className="text-[var(--muted)]">
                      {application.status === "approved" ? "Note: " : "Reason: "}
                    </span>
                    {application.decisionNote}
                  </p>
                ) : null}

                {application.reviewedAt ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Decided {application.reviewedAt.toLocaleString("en-GB")}
                    {application.reviewedByName ? ` by ${application.reviewedByName}` : ""}
                    {application.createdUserId ? (
                      <>
                        {" · "}
                        <Link
                          href={`/u/${application.createdUserId}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          their account
                        </Link>
                      </>
                    ) : null}
                  </p>
                ) : null}

                {application.status === "pending" ? (
                  <ApplicationDecision
                    applicationId={application.id}
                    displayName={application.displayName}
                  />
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </DashShell>
  );
}
