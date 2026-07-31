import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/register-form";
import { getCurrentUserQuietly } from "@/lib/dal";
import { Card } from "@/components/ui";

export const metadata = { title: "Create an account — PES Escrow" };

export default async function RegisterPage() {
  // Quietly: the form must render even with a broken database, so that
  // submitting it can report the actual reason.
  const user = await getCurrentUserQuietly();

  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        You need one to open a deal or to join one you were invited to.
      </p>
      <Card>
        <RegisterForm />
      </Card>
    </div>
  );
}
