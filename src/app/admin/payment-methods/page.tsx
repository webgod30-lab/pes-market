import { requireUserOrProblem } from "@/lib/dal";
import { listAllPaymentMethods } from "@/lib/payment-methods";
import { listProviders } from "@/lib/payments";
import { PaymentMethodForm, PaymentMethodRow } from "@/components/payment-method-editor";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { Alert, Card, SetupProblem } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { ADMIN_PAYMENT_METHODS_PAGE } from "@/lib/page-copy";

export const metadata = { title: "Payment methods — admin" };

export default async function PaymentMethodsPage() {
  const auth = await requireUserOrProblem(["admin"], "/admin/payment-methods");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const locale = await getLocale();
  const copy = ADMIN_PAYMENT_METHODS_PAGE[locale];

  const methods = await listAllPaymentMethods();
  const providers = listProviders();

  return (
    <DashShell groups={adminSections({})} title={copy.title} description={copy.description}>
      <div className="max-w-3xl">
        <Alert tone="warning" className="mb-4">
          {copy.placeholderWarning}
        </Alert>

        {methods.length === 0 ? (
          <EmptyPanel icon="card" title={copy.noneYetTitle}>
            {copy.noneYetBody}
          </EmptyPanel>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <PaymentMethodRow key={method.id} method={method} providers={providers} />
            ))}
          </div>
        )}

        <Card className="mt-6">
          <h2 className="mb-4 text-sm font-semibold">{copy.addMethod}</h2>
          <PaymentMethodForm providers={providers} />
        </Card>
      </div>
    </DashShell>
  );
}
