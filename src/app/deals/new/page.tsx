import { requireUserOrProblem } from "@/lib/dal";
import { getLocale } from "@/lib/locale-server";
import { CreateDealForm } from "@/components/create-deal-form";
import { traderSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { ESCROW_STEPS } from "@/lib/escrow-flow";
import { MINIMUM_TEAM_STRENGTH } from "@/lib/referrals";
import { Card, SetupProblem } from "@/components/ui";

export const metadata = { title: "Open a deal" };

export default async function NewDealPage() {
  const auth = await requireUserOrProblem(null, "/deals/new");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const locale = await getLocale();

  return (
    <DashShell
      groups={traderSections({})}
      title="Open a swap"
      description="Record the trade you already agreed. The other person joins with a code, and neither account moves until the admin has checked both."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <Card>
          <CreateDealForm locale={locale} minimumTeamStrength={MINIMUM_TEAM_STRENGTH} />
        </Card>

        {/* What happens after the form. Someone opening their first deal is
            about to send a stranger a code, and the reasonable next question is
            "and then what?" — answered here rather than on another page. */}
        <aside className="lg:sticky lg:top-20">
          <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold">What happens next</h2>

            <ol className="mt-3 space-y-2.5">
              {ESCROW_STEPS.slice(1, 5).map((step) => (
                <li key={step.n} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-[var(--border)] text-[0.625rem] font-semibold text-[var(--muted)]"
                  >
                    {step.n}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">{step.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-[var(--muted)]">
                      {step.short}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--foreground)]">This costs nothing.</strong> There is no
              fee on a swap and no money in it — you each hand over an account, and the admin holds
              both until they have checked them.
            </p>
          </div>
        </aside>
      </div>
    </DashShell>
  );
}
