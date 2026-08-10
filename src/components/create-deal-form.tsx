"use client";

import { useActionState, useState } from "react";

import { createDealAction } from "@/app/actions/deal-actions";
import { splitDealMoney } from "@/lib/fees";
import { formatCents, parsePriceToCents } from "@/lib/money";
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

const KINDS = [
  {
    value: "cash",
    titleKey: "deal.kind.cash",
    detailKey: "deal.kind.cashDetail",
    icon: "wallet",
  },
  {
    value: "swap",
    titleKey: "deal.kind.swap",
    detailKey: "deal.kind.swapDetail",
    icon: "ticket",
  },
] as const satisfies readonly Choice[];

type Choice = {
  value: string;
  titleKey: MessageKey;
  detailKey: MessageKey;
  icon: NavIconName;
};

/**
 * Open a deal.
 *
 * The action, the field names and the money maths are untouched — the split
 * shown while typing is still a preview, and `createDealAction` recomputes it
 * on the server. Only the form's shape changed: the three loose optional
 * fields became one labelled group, the side choice became a proper pair of
 * cards, and the split panel now says plainly which of the two numbers is the
 * one *you* end up with.
 */
export function CreateDealForm({ feeBps, locale }: { feeBps: number; locale: Locale }) {
  const t = translator(locale);
  const [state, formAction, pending] = useActionState(createDealAction, undefined);

  // Held in state purely to show the split as it is typed. The authoritative
  // numbers are recomputed on the server — this is a preview, not an input.
  const [side, setSide] = useState<string>(state?.values?.side ?? "seller");
  const [price, setPrice] = useState<string>(state?.values?.agreedPriceCents ?? "");
  const [tradeKind, setTradeKind] = useState<string>(state?.values?.tradeKind ?? "cash");

  const isSwap = tradeKind === "swap";
  const cents = parsePriceToCents(price);
  const split = cents === null ? null : splitDealMoney(cents, feeBps);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.message} />

      {/* First, because it changes what every field below it means: a swap has
          no price, and the person on the other side owes an account rather
          than money. */}
      <ChoiceCards
        legend={t("deal.kind.legend")}
        name="tradeKind"
        options={KINDS}
        selected={tradeKind}
        onSelect={setTradeKind}
        t={t}
      />

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
        label={t(isSwap ? "deal.summary.swapLabel" : "deal.summary.label")}
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

      {isSwap ? (
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
      ) : (
        <Field
          label={t("deal.price.label")}
          name="agreedPriceCents"
          error={state?.fieldErrors?.agreedPriceCents}
          hint={t("deal.price.hint")}
        >
          <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]"
          >
            $
          </span>
          <input
            id="agreedPriceCents"
            name="agreedPriceCents"
            inputMode="decimal"
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            aria-invalid={Boolean(state?.fieldErrors?.agreedPriceCents) || undefined}
            aria-describedby={fieldDescribedBy("agreedPriceCents", {
              hint: t("deal.price.hint"),
              error: state?.fieldErrors?.agreedPriceCents,
            })}
              className={cn(inputClassName, "ps-7 tabular-nums")}
              placeholder="185.00"
            />
          </div>
        </Field>
      )}

      {isSwap ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="text-overline uppercase text-[var(--muted)]">{t("swap.protection.title")}</p>

          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
            {t("swap.protection.body")}
          </p>

          <p className="mt-3 border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">
            {t("swap.protection.fee")}
          </p>
        </div>
      ) : null}

      {!isSwap && split ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="text-overline uppercase text-[var(--muted)]">{t("deal.split.title")}</p>

          <dl className="mt-2.5 space-y-1.5 text-sm">
            <Split label={t("deal.split.buyerPays")} value={formatCents(split.agreedPriceCents)} />
            <Split label={t("deal.split.fee")} value={`−${formatCents(split.feeCents)}`} />
            <div className="flex justify-between border-t border-[var(--border)] pt-1.5">
              <dt className="text-[var(--muted)]">{t("deal.split.sellerGets")}</dt>
              <dd className="font-semibold tabular-nums text-[var(--accent)]">
                {formatCents(split.sellerPayoutCents)}
              </dd>
            </div>
          </dl>

          {/* Which of those numbers is yours. The split is symmetrical; your
              position in it is not. */}
          <p className="mt-3 border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">
            {side === "seller" ? (
              <>
                You receive{" "}
                <strong className="text-[var(--foreground)]">
                  {formatCents(split.sellerPayoutCents)}
                </strong>{" "}
                once the buyer confirms.
              </>
            ) : (
              <>
                You pay{" "}
                <strong className="text-[var(--foreground)]">
                  {formatCents(split.agreedPriceCents)}
                </strong>{" "}
                — never more. The fee comes out of the seller&apos;s side.
              </>
            )}
          </p>
        </div>
      ) : null}

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

function Split({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
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
