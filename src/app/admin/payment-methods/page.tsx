import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listAllPaymentMethods } from "@/lib/payment-methods";
import { listProviders } from "@/lib/payments";
import { PaymentMethodForm, PaymentMethodRow } from "@/components/payment-method-editor";
import { AdminNav } from "@/components/admin-nav";
import { Card, EmptyState, PageHeading, SetupProblem } from "@/components/ui";

export const metadata = { title: "Payment methods — admin — PES Escrow" };

export default async function PaymentMethodsPage() {
  const auth = await requireUserOrProblem(["admin"], "/admin/payment-methods");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const methods = await listAllPaymentMethods();
  const providers = listProviders();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title="Payment methods"
        description="What buyers are told to pay to. There is no gateway — you check the wallet or bank account yourself and confirm each payment by hand."
      />

      <AdminNav current="payments" />

      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
        The seeded addresses are placeholders. Replace them with your own before taking real money —
        a buyer paying a placeholder address loses their funds permanently.
      </div>

      {methods.length === 0 ? (
        <EmptyState>No payment methods yet. Add one below.</EmptyState>
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

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        <Link href="/admin" className="text-emerald-400 hover:underline">
          Back to the admin console
        </Link>
      </p>
    </div>
  );
}
