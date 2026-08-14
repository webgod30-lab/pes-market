import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { getCurrentUserQuietly } from "@/lib/dal";

export const metadata = {
  title: "Create an account",
  description:
    "Create a free PESescrow.com account to swap eFootball accounts safely. You need a promoter's code to join — and you get one of your own, worth $2 for every deal the people you bring in complete.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  // Quietly: the form must render even with a broken database, so that
  // submitting it can report the actual reason.
  const user = await getCurrentUserQuietly();

  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  // Not validated here. A wrong code has to be reported by the form, next to
  // the field, and looking it up now would only mean checking it twice.
  const { ref } = await searchParams;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Everyone here arrived through somebody. Paste their code to join."
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
      <RegisterForm initialReferralCode={ref ?? ""} />
    </AuthShell>
  );
}
