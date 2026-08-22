import type { ReactNode } from "react";

/** Wrapper for text-heavy pages: legal, FAQ, how it works. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl">{children}</div>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[var(--muted)]">{children}</div>
    </section>
  );
}

/** Bulleted list with readable spacing. */
export function Points({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 ps-5">
      {items.map((item, index) => (
        <li key={index} className="list-disc marker:text-emerald-500">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** For the "this is a template, get it reviewed" warnings. */
export function Notice({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "info" }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        tone === "warning"
          ? "border-amber-500/30 bg-amber-500/10 text-[var(--tone-warning)]"
          : "border-sky-500/30 bg-sky-500/10 text-[var(--tone-info)]"
      }`}
    >
      {children}
    </div>
  );
}

export function LastUpdated({ date, locale = "en" }: { date: string; locale?: "en" | "ar" }) {
  return (
    <p className="mt-2 text-xs text-[var(--muted)]">
      {locale === "ar" ? `آخر تحديث ${date}` : `Last updated ${date}`}
    </p>
  );
}
