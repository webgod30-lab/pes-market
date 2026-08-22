import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { surveyDemoData, DEMO_EMAIL_SUFFIXES } from "@/lib/demo-data";
import { PurgeDemoForm } from "@/components/purge-demo-form";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { Alert, Card, Overline, SetupProblem } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { ADMIN_DEMO_DATA_PAGE } from "@/lib/page-copy";

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

  const locale = await getLocale();
  const copy = ADMIN_DEMO_DATA_PAGE[locale];

  const survey = await surveyDemoData();
  const clean = survey.accounts === 0;

  return (
    <DashShell groups={adminSections({})} title={copy.title} description={copy.description}>
      <div className="max-w-3xl">
        {clean ? (
          <EmptyPanel icon="shield" title={copy.cleanTitle} tone="positive">
            {copy.cleanBody}
          </EmptyPanel>
        ) : (
          <>
            <Alert tone="danger">
              <p className="font-medium">{copy.servingFabricated(survey.reviews)}</p>
              <p className="mt-1.5 text-sm">{copy.fabricatedBody}</p>
            </Alert>

            <div className="mt-3">
              <StatGrid columns={4}>
                <StatCard label={copy.inventedAccounts} value={survey.accounts} icon="users" urgent />
                <StatCard label={copy.deals} value={survey.deals} icon="folder" urgent />
                <StatCard label={copy.reviews} value={survey.reviews} icon="star" urgent />
                <StatCard label={copy.referralCredits} value={survey.earnings} icon="wallet" urgent />
              </StatGrid>
            </div>

            {survey.sample.length > 0 ? (
              <Card className="mt-3">
                <Overline>{copy.sampleTitle}</Overline>
                <ul className="mt-2.5 space-y-2">
                  {survey.sample.map((review, index) => (
                    <li
                      key={index}
                      className="rounded-lg border border-[var(--border)] p-3 text-sm"
                    >
                      <p className="leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                      <p className="mt-1.5 text-xs text-[var(--muted)]">
                        {review.authorName} · {review.createdAt.toLocaleDateString(locale === "ar" ? "ar" : "en-GB")}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {survey.realReviewsAtRisk > 0 ? (
              <Alert tone="warning" className="mt-3">
                {copy.realAtRisk(survey.realReviewsAtRisk)} <strong>{locale === "ar" ? "ليست" : "not"}</strong>{" "}
                {copy.realAtRiskTail}
              </Alert>
            ) : null}

            <Card className="mt-3">
              <h2 className="text-sm font-semibold">{copy.survivesTitle}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                {copy.survivesBody(survey.realReviewsRemaining, survey.realCompletedDealsRemaining)}
                {survey.realReviewsRemaining === 0 ? <> {copy.zeroSurvives}</> : null}
              </p>

              {survey.adminsKept.length > 0 ? (
                <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
                  {copy.keptRegardless} {survey.adminsKept.map((admin) => admin.email).join(", ")}{" "}
                  {copy.keptRegardlessTail}
                </p>
              ) : null}

              <PurgeDemoForm accounts={survey.accounts} deals={survey.deals} />
            </Card>
          </>
        )}

        <Card className="mt-3">
          <Overline>{copy.howRecognisedTitle}</Overline>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{copy.howRecognisedBody}</p>
          <ul className="mt-2 space-y-1">
            {DEMO_EMAIL_SUFFIXES.map((suffix) => (
              <li key={suffix} className="font-mono text-xs text-[var(--muted)]">
                {suffix}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            {copy.terminalNote} <code className="font-mono">npm run purge:demo</code>
            {copy.terminalNoteMid} <code className="font-mono">--apply</code>
            {copy.terminalNoteTail} <code className="font-mono">db:seed</code> {copy.terminalNoteTail2}{" "}
            <code className="font-mono">bot:deals</code> {copy.terminalNoteTail3}{" "}
            <code className="font-mono">ALLOW_REMOTE_SEED=1</code> {copy.terminalNoteTail4}
          </p>
        </Card>

        <p className="mt-6 text-xs text-[var(--muted)]">
          <Link href="/reviews" className="text-[var(--accent)] hover:underline">
            {copy.seeReviews}
          </Link>
          .
        </p>
      </div>
    </DashShell>
  );
}
