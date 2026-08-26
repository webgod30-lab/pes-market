import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { getCurrentUserQuietly } from "@/lib/dal";
import { getLocale } from "@/lib/locale-server";
import { REGISTER_PAGE } from "@/lib/auth-copy";

export const metadata = {
  title: "Create an account",
  description:
    "Create a free PESescrow.com account to swap eFootball accounts safely. You need a promoter's code to join — and you get one of your own, worth $2 for every 3000+ rated swap the people you bring in complete.",
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

  const locale = await getLocale();
  const copy = REGISTER_PAGE[locale];

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <>
          {copy.alreadyRegistered}{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
            {copy.signIn}
          </Link>
        </>
      }
      aside={
        <>
          {copy.asideLead}{" "}
          <Link href="/terms" className="text-[var(--muted)] underline hover:text-[var(--accent)]">
            {copy.asideTerms}
          </Link>{" "}
          {copy.asideAnd}{" "}
          <Link href="/privacy" className="text-[var(--muted)] underline hover:text-[var(--accent)]">
            {copy.asidePrivacy}
          </Link>
          .
        </>
      }
    >
      <RegisterForm initialReferralCode={ref ?? ""} locale={locale} />
    </AuthShell>
  );
}
