import { requireUserOrProblem } from "@/lib/dal";
import { JoinDealForm } from "@/components/join-deal-form";
import { Card, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Join a deal" };

export default async function JoinDealPage() {
  const auth = await requireUserOrProblem(null, "/deals/join");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  return (
    <div className="mx-auto max-w-md">
      <PageHeading
        title="Join a deal"
        description="Someone sent you an invite code for a deal you already agreed."
      />
      <Card>
        <JoinDealForm />
      </Card>
    </div>
  );
}
