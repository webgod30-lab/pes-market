import { requireUserOrProblem } from "@/lib/dal";
import { JoinDealForm } from "@/components/join-deal-form";
import { Card, PageHeading, SetupProblem } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { JOIN_DEAL_PAGE } from "@/lib/page-copy";

export const metadata = { title: "Join a deal" };

export default async function JoinDealPage() {
  const auth = await requireUserOrProblem(null, "/deals/join");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const locale = await getLocale();
  const copy = JOIN_DEAL_PAGE[locale];

  return (
    <div className="mx-auto max-w-md">
      <PageHeading title={copy.title} description={copy.description} />
      <Card>
        <JoinDealForm locale={locale} />
      </Card>
    </div>
  );
}
