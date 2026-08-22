import type { Reputation } from "@/lib/reviews";
import type { Locale } from "@/lib/locale";

/**
 * A counterparty's track record, in one line.
 *
 * Deliberately honest about having no history: "no reviews yet" is useful
 * information when you are deciding whether to send someone an account, and
 * dressing it up as a neutral score would not be.
 */
export function ReputationLine({
  reputation,
  name,
  locale = "en",
}: {
  reputation: Reputation;
  name?: string;
  locale?: Locale;
}) {
  const { count, average, completedSales, completedPurchases } = reputation;
  const completed = completedSales + completedPurchases;
  const ar = locale === "ar";

  const dealsSuffix = ar
    ? completed > 0
      ? ` · ${completed} صفقة مكتملة`
      : ""
    : completed > 0
      ? ` · ${completed} completed deal${completed === 1 ? "" : "s"}`
      : "";

  if (count === 0) {
    if (ar) {
      return (
        <p className="text-xs text-[var(--muted)]">
          {name ? `${name} ` : ""}
          لا توجد تقييمات بعد
          {completed > 0 ? dealsSuffix : " · لا صفقات مكتملة"}
        </p>
      );
    }

    return (
      <p className="text-xs text-[var(--muted)]">
        {name ? `${name} has ` : ""}
        no reviews yet
        {completed > 0 ? dealsSuffix : " · no completed deals"}
      </p>
    );
  }

  if (ar) {
    return (
      <p className="text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--tone-warning)]">{average?.toFixed(1)} ★</span> من {count} تقييم
        {dealsSuffix}
      </p>
    );
  }

  return (
    <p className="text-xs text-[var(--muted)]">
      <span className="font-medium text-[var(--tone-warning)]">{average?.toFixed(1)} ★</span> from {count} review
      {count === 1 ? "" : "s"}
      {dealsSuffix}
    </p>
  );
}

/** Five stars, filled to the rating. */
export function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5`} className="text-[var(--tone-warning)]">
      {"★".repeat(rating)}
      <span className="text-[var(--border)]">{"★".repeat(5 - rating)}</span>
    </span>
  );
}
