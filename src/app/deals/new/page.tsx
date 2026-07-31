import { requireUserOrProblem } from "@/lib/dal";
import { defaultFeeBps, formatFeeBps } from "@/lib/fees";
import { CreateDealForm } from "@/components/create-deal-form";
import { Card, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Open a deal — PES Escrow" };

export default async function NewDealPage() {
  const auth = await requireUserOrProblem(null, "/deals/new");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const feeBps = defaultFeeBps();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        title="Open a deal"
        description="Record what you already agreed. The other person joins with a code, and nothing moves until the admin has checked the account."
      />

      <Card>
        <CreateDealForm feeBps={feeBps} />
      </Card>

      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Escrow fee is currently {formatFeeBps(feeBps)}, taken from the seller&apos;s payout. It is
        locked to this deal when you create it.
      </p>
    </div>
  );
}
