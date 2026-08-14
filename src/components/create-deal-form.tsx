"use client";

import { useActionState, useState } from "react";

import { createDealAction } from "@/app/actions/deal-actions";
import { NavIcon, type NavIconName } from "@/components/nav/nav-icons";
import { translator, type MessageKey, type Translate } from "@/lib/dictionary";
import type { Locale } from "@/lib/locale";
import {
  Button,
  Field,
  fieldDescribedBy,
  FormError,
  cn,
  inputClassName,
} from "@/components/ui";

const SIDES = [
  {
    value: "seller",
    titleKey: "deal.side.seller",
    detailKey: "deal.side.sellerDetail",
    icon: "payout",
  },
  {
    value: "buyer",
    titleKey: "deal.side.buyer",
    detailKey: "deal.side.buyerDetail",
    icon: "wallet",
  },
] as const satisfies readonly Choice[];

type Choice = {
  value: string;
  titleKey: MessageKey;
  detailKey: MessageKey;
  icon: NavIconName;
};

/**
 * Open a swap.
 *
 * Every deal is account-for-account, so there is no kind to choose and no price
 * to enter — both boxes are accounts, and the only question about money is that
 * there isn't any. The side choice remains, because it decides which of the two
 * descriptions is yours and therefore which side the invite leaves open.
 */
export function CreateDealForm({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const [state, formAction, pending] = useActionState(createDealAction, undefined);

  const [side, setSide] = useState<string>(state?.values?.side ?? "seller");

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.message} />

      <ChoiceCards
        legend={t("deal.side.legend")}
        name="side"
        options={SIDES}
        selected={side}
        onSelect={setSide}
        error={state?.fieldErrors?.side}
        t={t}
      />

      <Field
        label={t("deal.summary.swapLabel")}
        name="accountSummary"
        error={state?.fieldErrors?.accountSummary}
        hint={t("deal.summary.hint")}
      >
        <textarea
          id="accountSummary"
          name="accountSummary"
          required
          rows={4}
          defaultValue={state?.values?.accountSummary ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.accountSummary) || undefined}
          aria-describedby={fieldDescribedBy("accountSummary", {
            hint: t("deal.summary.hint"),
            error: state?.fieldErrors?.accountSummary,
          })}
          className={inputClassName}
          placeholder="eFootball 2026 mobile account. 4 Legends (Messi, Ronaldinho, Zico, Kaka), squad rating 3200, original email included, no bans."
        />
      </Field>

      {/* Grouped rather than three loose inputs: only one of the three is
          required, and saying so once beats writing "Optional" twice. */}
      <fieldset className="rounded-[var(--radius-card)] border border-[var(--border)] p-4">
        <legend className="px-1.5 text-sm font-medium">{t("deal.account.legend")}</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("deal.account.game")} name="game" error={state?.fieldErrors?.game}>
            <input
              id="game"
              name="game"
              required
              defaultValue={state?.values?.game ?? "eFootball"}
              aria-invalid={Boolean(state?.fieldErrors?.game) || undefined}
              className={inputClassName}
            />
          </Field>

          <Field
            label={t("deal.account.platform")}
            name="platform"
            error={state?.fieldErrors?.platform}
            hint={t("deal.account.optional")}
          >
            <input
              id="platform"
              name="platform"
              defaultValue={state?.values?.platform ?? ""}
              aria-describedby={fieldDescribedBy("platform", { hint: t("deal.account.optional") })}
              className={inputClassName}
              placeholder="Mobile, PS5, Xbox, PC"
            />
          </Field>

          <Field
            label={t("deal.account.level")}
            name="level"
            error={state?.fieldErrors?.level}
            hint={t("deal.account.optional")}
          >
            <input
              id="level"
              name="level"
              inputMode="numeric"
              defaultValue={state?.values?.level ?? ""}
              aria-invalid={Boolean(state?.fieldErrors?.level) || undefined}
              aria-describedby={fieldDescribedBy("level", {
                hint: t("deal.account.optional"),
                error: state?.fieldErrors?.level,
              })}
              className={inputClassName}
              placeholder="42"
            />
          </Field>
        </div>
      </fieldset>

      <Field
        label={t("deal.counter.label")}
        name="counterAccountSummary"
        error={state?.fieldErrors?.counterAccountSummary}
        hint={t("deal.counter.hint")}
      >
        <textarea
          id="counterAccountSummary"
          name="counterAccountSummary"
          required
          rows={4}
          defaultValue={state?.values?.counterAccountSummary ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.counterAccountSummary) || undefined}
          aria-describedby={fieldDescribedBy("counterAccountSummary", {
            hint: t("deal.counter.hint"),
            error: state?.fieldErrors?.counterAccountSummary,
          })}
          className={inputClassName}
          placeholder="eFootball 2026 mobile account. 3 Legends (Zidane, Pirlo, Nedved), squad rating 3050, original email included, no bans."
        />
      </Field>

      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <p className="text-overline uppercase text-[var(--muted)]">{t("swap.protection.title")}</p>

        <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
          {t("swap.protection.body")}
        </p>

        <p className="mt-3 border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">
          {t("swap.protection.fee")}
        </p>
      </div>

      <div>
        <Button type="submit" loading={pending} disabled={pending} block>
          {pending ? t("deal.submitting") : t("deal.submit")}
        </Button>

        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          {t("deal.submitNote")}
        </p>
      </div>
    </form>
  );
}

/**
 * A radio group drawn as cards.
 *
 * Extracted because the form now asks two either/or questions with the same
 * shape, and the second one changes what the rest of the form means — a
 * difference worth as much visual weight as the first.
 */
function ChoiceCards({
  legend,
  name,
  options,
  selected,
  onSelect,
  error,
  t,
}: {
  legend: string;
  name: string;
  options: readonly Choice[];
  t: Translate;
  selected: string;
  onSelect: (value: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((choice) => {
          const isSelected = selected === choice.value;

          return (
            <label
              key={choice.value}
              className={cn(
                "cursor-pointer rounded-[var(--radius-card)] border p-3.5 transition-colors",
                // The radio itself is sr-only, so the focus ring has to be
                // drawn on the label instead — otherwise tabbing through this
                // group shows nothing at all.
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]",
                isSelected
                  ? "border-[var(--accent)] bg-[var(--tone-success-bg)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/40",
              )}
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={name}
                  value={choice.value}
                  checked={isSelected}
                  onChange={(event) => onSelect(event.target.value)}
                  className="sr-only"
                />

                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] border transition-colors",
                    isSelected
                      ? "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)]",
                  )}
                >
                  <NavIcon name={choice.icon} className="size-4" />
                </span>

                <span className="text-sm font-medium">{t(choice.titleKey)}</span>

                {/* The tick is the only thing that changes shape, so the
                    selected card is not distinguished by colour alone. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "ms-auto grid size-4 shrink-0 place-items-center rounded-full border",
                    isSelected
                      ? "border-transparent bg-[var(--accent)] text-[var(--background)]"
                      : "border-[var(--border)]",
                  )}
                >
                  {isSelected ? <TickIcon /> : null}
                </span>
              </span>

              <span className="mt-1.5 block text-xs leading-relaxed text-[var(--muted)]">
                {t(choice.detailKey)}
              </span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-[var(--tone-danger)]">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function TickIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4.5 4.5L19 7" />
    </svg>
  );
}
