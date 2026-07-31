import Link from "next/link";

/** Shared navigation across the admin console, so every screen is one click away. */
export function AdminNav({ current }: { current: "hub" | "deals" | "disputes" | "users" | "payments" }) {
  const items = [
    { key: "hub", href: "/admin", label: "Overview" },
    { key: "deals", href: "/admin/deals", label: "Deals" },
    { key: "disputes", href: "/admin/disputes", label: "Disputes" },
    { key: "users", href: "/admin/users", label: "Users" },
    { key: "payments", href: "/admin/payment-methods", label: "Payment methods" },
  ] as const;

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-[var(--border)] pb-3">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            current === item.key
              ? "bg-emerald-500/10 font-medium text-emerald-300"
              : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
