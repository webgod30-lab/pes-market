import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { getCurrentUserQuietly } from "@/lib/dal";

export const metadata = {
  title: "Create an account",
  description:
    "Create a free PESescrow.com account to open an escrowed eFootball account trade, or to join one you were invited to. One account covers both buying and selling.",
};

export default async function RegisterPage() {
  // Quietly: the form must render even with a broken database, so that
  // submitting it can report the actual reason.
  const user = await getCurrentUserQuietly();

  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <AuthShell
      title="Create your account"
      subtitle="You need one to open a deal, or to join one you were invited to."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </>
      }
      aside={
        <>
          By creating an account you agree to the{" "}
          <Link href="/terms" className="text-[var(--muted)] underline hover:text-[var(--accent)]">
            terms
          </Link>{" "}
          and the{" "}
          <Link href="/privacy" className="text-[var(--muted)] underline hover:text-[var(--accent)]">
            privacy policy
          </Link>
          .
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
