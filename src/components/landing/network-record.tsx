import { SITE } from "@/lib/site";
import type { Locale } from "@/lib/locale";

/**
 * The promoter network's track record, from before this platform existed.
 *
 * These figures cannot come from the database — the site is new and the
 * operation behind it is not — so they live in SITE.network and are always
 * shown attributed. That attribution is the load-bearing part: a visitor who
 * reads "200 promoters" and then sees a handful of completed deals will
 * conclude the number is invented unless the page has already told them it
 * belongs to the network rather than the software.
 *
 * Said plainly, the gap stops being a contradiction and becomes the pitch: the
 * trading has been happening for a while, the escrow is the new part.
 */
const COPY: Record<Locale, { overline: string; promoters: string; payout: string; body: string }> = {
  en: {
    overline: "We were doing this before the site existed",
    promoters: "Promoters across the network",
    payout: "Paid out to them monthly",
    body: "The swaps were already happening and already being refereed by hand. This site is the part that is new — built so they run on something, and so nobody has to take a stranger's word for it.",
  },
  ar: {
    overline: "كنا نقوم بهذا قبل وجود الموقع",
    promoters: "داعون عبر الشبكة",
    payout: "يُدفع لهم شهريًا",
    body: "كانت المبادلات تحدث بالفعل وتُدار يدويًا. هذا الموقع هو الجزء الجديد — بُني لتجري عليه، ولئلا يضطر أحد إلى تصديق كلام شخص غريب.",
  },
};

export function NetworkRecord({ locale = "en" }: { locale?: Locale }) {
  const copy = COPY[locale];

  return (
    <section aria-label={copy.overline} className="mx-auto max-w-3xl px-4">
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-5">
        <p className="text-overline uppercase text-[var(--muted)]">{copy.overline}</p>

        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--muted)]">{copy.promoters}</dt>
            <dd className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">
              {SITE.network.promoters}+
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">{copy.payout}</dt>
            <dd className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">
              ${(SITE.network.monthlyPayoutUsd / 1000).toFixed(0)}k+
            </dd>
          </div>
        </dl>

        <p className="mt-4 border-t border-[var(--border)] pt-3.5 text-sm leading-relaxed text-[var(--muted)]">
          {copy.body}
        </p>
      </div>
    </section>
  );
}
