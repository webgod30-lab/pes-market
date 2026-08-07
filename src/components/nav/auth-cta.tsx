import { ButtonLink, cn } from "@/components/ui";
import { translator } from "@/lib/dictionary";
import type { Locale } from "@/lib/locale";

/**
 * The signed-out call to action.
 *
 * One component for both the bar and the mobile sheet, because these two
 * buttons are the single most important thing in the header for a visitor who
 * has not signed up, and they were previously written out twice with different
 * labels — "Get started" in the bar, "Create an account" in the sheet.
 *
 * The primary button carries a soft emerald bloom rather than a flat fill. It
 * is the only element in the bar with a shadow, which is what makes the eye
 * land on it first without it having to be bigger or louder.
 */
export function AuthCta({ stacked = false, locale }: { stacked?: boolean; locale: Locale }) {
  const t = translator(locale);
  return (
    <div className={cn(stacked ? "flex flex-col gap-2" : "flex items-center gap-2")}>
      <ButtonLink
        href="/login"
        variant="ghost"
        size="sm"
        block={stacked}
        // Reordered when stacked: on a phone the sheet is read top to bottom
        // and the primary action should be the first thing reachable.
        className={cn(stacked && "order-2")}
      >
        {t("account.signIn")}
      </ButtonLink>

      <ButtonLink
        href="/register"
        size="sm"
        block={stacked}
        className={cn(
          "shadow-[0_0_0_1px_var(--tone-success-border),0_6px_20px_-6px_rgb(16_185_129/0.55)]",
          "transition-shadow hover:shadow-[0_0_0_1px_var(--tone-success-border),0_8px_26px_-6px_rgb(16_185_129/0.7)]",
          stacked ? "order-1" : "hidden sm:inline-flex",
        )}
      >
        {t("account.startDeal")}
      </ButtonLink>
    </div>
  );
}
