import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login-form";
import { getCurrentUserQuietly } from "@/lib/dal";

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

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        safeNext
          ? "Sign in to continue to where you were headed."
          : "Sign in to see your deals and what each one is waiting on."
      }
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="font-medium text-[var(--accent)] hover:underline">
            Create one
          </Link>
        </>
      }
      aside="We will never ask for your password anywhere except this page. Check the address bar before typing it."
    >
      <LoginForm next={safeNext} />
    </AuthShell>
  );
}
