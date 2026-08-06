import { requireUserOrProblem } from "@/lib/dal";
import { listAllPaymentMethods } from "@/lib/payment-methods";
import { listProviders } from "@/lib/payments";
import { PaymentMethodForm, PaymentMethodRow } from "@/components/payment-method-editor";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { Alert, Card, SetupProblem } from "@/components/ui";

export const metadata = { title: "Payment methods — admin" };

export default async function PaymentMethodsPage() {
  const auth = await requireUserOrProblem(["admin"], "/admin/payment-methods");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const methods = await listAllPaymentMethods();
  const providers = listProviders();

  return (
    <DashShell
      groups={adminSections({})}
      title="Payment methods"
      description="What buyers are told to pay to. There is no gateway — you check the wallet or bank account yourself and confirm each payment by hand."
    >
      <div className="max-w-3xl">
        <Alert tone="warning" className="mb-4">
          The seeded addresses are placeholders. Replace them with your own before taking real money
          — a buyer paying a placeholder address loses their funds permanently.
        </Alert>

        {methods.length === 0 ? (
          <EmptyPanel icon="card" title="No payment methods yet">
            Until one is active, a buyer opening a deal has nowhere to send money. Add your first
            below.
          </EmptyPanel>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <PaymentMethodRow key={method.id} method={method} providers={providers} />
            ))}
          </div>
        )}

        <Card className="mt-6">
          <h2 className="mb-4 text-sm font-semibold">Add a method</h2>
          <PaymentMethodForm providers={providers} />
        </Card>
      </div>
    </DashShell>
  );
}
