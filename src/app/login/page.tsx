import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getCurrentUserQuietly } from "@/lib/dal";
import { Card } from "@/components/ui";

export const metadata = { title: "Sign in — PES Escrow" };

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
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Sign in to see your deals.</p>
      <Card>
        <LoginForm next={safeNext} />
      </Card>
    </div>
  );
}
