import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login-form";
import { getCurrentUserQuietly } from "@/lib/dal";
import { getLocale } from "@/lib/locale-server";
import { LOGIN_PAGE } from "@/lib/auth-copy";

export const metadata = {
  title: "Sign in",
  description:
    "Sign in to PESescrow.com to see your deals and what each one is waiting on. Two-factor supported.",
  // A sign-in form has no business in search results, and indexing it splits
  // the ranking of the pages that should be found instead.
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  // In Next.js 16 searchParams is a Promise and must be awaited.
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Only relative paths, so a crafted ?next=https://evil.example cannot make
  // this form redirect off-site after login.
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  // Quietly: if the database is down we still want the form to render, because
  // submitting it is what surfaces the precise reason.
  const user = await getCurrentUserQuietly();

  // Already signed in — no reason to show the form. Honour ?next so that
  // following an invite link while logged in lands on the deal rather than
  // dumping you on the dashboard.
  if (user) redirect(safeNext ?? (user.role === "admin" ? "/admin" : "/dashboard"));

  const locale = await getLocale();
  const copy = LOGIN_PAGE[locale];

  return (
    <AuthShell
      title={copy.title}
      subtitle={safeNext ? copy.subtitleNext : copy.subtitleDefault}
      footer={
        <>
          {copy.noAccount}{" "}
          <Link href="/register" className="font-medium text-[var(--accent)] hover:underline">
            {copy.createOne}
          </Link>
        </>
      }
      aside={copy.aside}
    >
      <LoginForm next={safeNext} locale={locale} />
    </AuthShell>
  );
}
