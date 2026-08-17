import type { Locale } from "@/lib/locale";

/**
 * The one thing escrow cannot do, said in one place.
 *
 * Every trader already knows a publisher can reclaim a traded account. Being
 * the site that says it out loud costs nothing and buys the only kind of
 * credibility that survives contact with an expert audience — and it inoculates
 * against the day somebody's traded account really is suspended, because they
 * were told, in writing, before they started.
 *
 * One component rather than the same paragraph written out three times. The
 * wording is load-bearing: it is a limitation-of-liability statement as much as
 * a piece of copy, and three drifting copies of it would be three different
 * promises.
 *
 * The last sentence is doing separate work. "Treat anyone who claims otherwise
 * as a warning sign" quietly positions every competitor who oversells safety,
 * and it is the line people screenshot.
 */
const COPY: Record<Locale, { title: string; body: string; tail: string }> = {
  en: {
    title: "What we don't protect you from",
    body: "Konami, like most publishers, prohibits selling or transferring accounts. A publisher can suspend a traded account, and this service cannot stop that or reverse it. We protect you from the person you're trading with.",
    tail: "Nobody can protect you from the publisher — treat anyone who claims otherwise as a warning sign.",
  },
  ar: {
    title: "ما لا نحميك منه",
    body: "كونامي، مثل معظم الناشرين، تمنع بيع الحسابات أو نقلها. ويستطيع الناشر تعليق حساب مُتداوَل، ولا تستطيع هذه الخدمة منع ذلك أو التراجع عنه. نحن نحميك ممن تتبادل معه.",
    tail: "لا أحد يستطيع حمايتك من الناشر — واعتبر كل من يدّعي غير ذلك علامة تحذير.",
  },
};

export function PublisherWarning({
  locale = "en",
  className = "",
}: {
  locale?: Locale;
  className?: string;
}) {
  const copy = COPY[locale];

  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] p-4 ${className}`}
    >
      <p className="text-overline uppercase text-[var(--tone-warning)]">{copy.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        {copy.body}{" "}
        <strong className="text-[var(--foreground)]">{copy.tail}</strong>
      </p>
    </div>
  );
}

/**
 * The same point, compressed to one line.
 *
 * For the deal page, immediately above the button that hands an account over.
 * A full panel there would be read as chrome and skipped; a single line at the
 * moment of commitment is read.
 */
export function PublisherWarningLine({ locale = "en" }: { locale?: Locale }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
      {locale === "ar"
        ? "تذكير: هذا يحميك من الطرف الآخر، لا من كونامي."
        : "Reminder: this protects you from your trading partner, not from Konami."}
    </p>
  );
}
