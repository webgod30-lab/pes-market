import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { surveyDemoData, DEMO_EMAIL_SUFFIXES } from "@/lib/demo-data";
import { PurgeDemoForm } from "@/components/purge-demo-form";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Alert, Card, Overline, SetupProblem } from "@/components/ui";

export const metadata = { title: "Demo data — admin" };

export const dynamic = "force-dynamic";

/**
 * Find and remove invented people.
 *
 * The seed and the deal bot both write accounts, deals and reviews under
 * reserved addresses. Both carry a guard meant to keep them off production.
 * This page is for when one of them got through — which is not hypothetical:
 * the reviews it produces describe a payment flow this service does not have,
 * because they were written for the retired cash model.
 */
export default async function AdminDemoDataPage() {
  const auth = await requireUserOrProblem(["admin"], "/admin/demo-data");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const survey = await surveyDemoData();
  const clean = survey.accounts === 0;

  return (
    <DashShell
      groups={adminSections({})}
      title="Demo data"
      description="Accounts invented by the seed or the deal bot, and everything they produced. Fabricated reviews on a trust service are the one failure that cannot be walked back — this is how you remove them."
    >
      <div className="max-w-3xl">
        {clean ? (
          <EmptyPanel icon="shield" title="No demo data on this database" tone="positive">
            Nothing here was invented by the seed or the bot. Every review on the site came from a
            real account.
          </EmptyPanel>
        ) : (
          <>
            <Alert tone="danger">
              <p className="font-medium">
                This database is serving {survey.reviews} fabricated review
                {survey.reviews === 1 ? "" : "s"}.
              </p>
              <p className="mt-1.5 text-sm">
                They were written by accounts that do not belong to anyone, about deals that never
                happened, and several describe paying money — which this service no longer does.
                Anyone who reads the product pages and then the reviews will notice.
              </p>
            </Alert>

            <div className="mt-3">
              <StatGrid columns={4}>
                <StatCard label="Invented accounts" value={survey.accounts} icon="users" urgent />
                <StatCard label="Deals" value={survey.deals} icon="folder" urgent />
                <StatCard label="Reviews" value={survey.reviews} icon="star" urgent />
                <StatCard label="Referral credits" value={survey.earnings} icon="wallet" urgent />
              </StatGrid>
            </div>

            {survey.sample.length > 0 ? (
              <Card className="mt-3">
                <Overline>A few of the reviews this would remove</Overline>
                <ul className="mt-2.5 space-y-2">
                  {survey.sample.map((review, index) => (
                    <li
                      key={index}
                      className="rounded-lg border border-[var(--border)] p-3 text-sm"
                    >
                      <p className="leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                      <p className="mt-1.5 text-xs text-[var(--muted)]">
                        {review.authorName} · {review.createdAt.toLocaleDateString("en-GB")}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {survey.realReviewsAtRisk > 0 ? (
              <Alert tone="warning" className="mt-3">
                {survey.realReviewsAtRisk} of these reviews were written by an account that is{" "}
                <strong>not</strong> demo data. Check those before deleting — they may be genuine.
              </Alert>
            ) : null}

            <Card className="mt-3">
              <h2 className="text-sm font-semibold">What survives</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {survey.realReviewsRemaining} review
                {survey.realReviewsRemaining === 1 ? "" : "s"} and{" "}
                {survey.realCompletedDealsRemaining} completed deal
                {survey.realCompletedDealsRemaining === 1 ? "" : "s"} from real accounts.
                {survey.realReviewsRemaining === 0 ? (
                  <>
                    {" "}
                    That is zero — and an empty reviews page you can defend beats a full one you
                    cannot. Being visibly new is survivable; being caught inventing a track record
                    is not.
                  </>
                ) : null}
              </p>

              {survey.adminsKept.length > 0 ? (
                <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
                  Kept regardless:{" "}
                  {survey.adminsKept.map((admin) => admin.email).join(", ")} — an admin account is
                  never deleted here. Losing the only one locks the console permanently.
                </p>
              ) : null}

              <PurgeDemoForm accounts={survey.accounts} deals={survey.deals} />
            </Card>
          </>
        )}

        <Card className="mt-3">
          <Overline>How demo data is recognised</Overline>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
            By email domain, not by guesswork. Everything the seed and the bot create lives on a
            reserved domain that can never resolve to a real inbox:
          </p>
          <ul className="mt-2 space-y-1">
            {DEMO_EMAIL_SUFFIXES.map((suffix) => (
              <li key={suffix} className="font-mono text-xs text-[var(--muted)]">
                {suffix}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            The same check runs from a terminal as{" "}
            <code className="font-mono">npm run purge:demo</code>, which reports without deleting
            unless you pass <code className="font-mono">--apply</code>. To stop this happening
            again, never run <code className="font-mono">db:seed</code> or{" "}
            <code className="font-mono">bot:deals</code> with{" "}
            <code className="font-mono">ALLOW_REMOTE_SEED=1</code> against the live database.
          </p>
        </Card>

        <p className="mt-6 text-xs text-[var(--muted)]">
          <Link href="/reviews" className="text-[var(--accent)] hover:underline">
            See what the public reviews page currently shows
          </Link>
          .
        </p>
      </div>
    </DashShell>
  );
}
