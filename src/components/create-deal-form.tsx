"use client";

import { useActionState, useState } from "react";

import { createDealAction } from "@/app/actions/deal-actions";
import { NavIcon, type NavIconName } from "@/components/nav/nav-icons";
import { translator, type MessageKey, type Translate } from "@/lib/dictionary";
import type { FormState } from "@/lib/form-state";
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
 * The form field names for one account, so the card below can be rendered
 * twice against two sets of columns.
 *
 * Spelled out rather than derived by sticking "counter" in front of things: a
 * name built at runtime is one typo away from posting a field the schema never
 * reads, and nothing would fail — the value would just quietly not be saved.
 */
type AccountNames = {
  summary: string;
  platform: string;
  level: string;
  teamStrength: string;
  epics: string;
  epicPlayers: string;
};

const YOUR_ACCOUNT: AccountNames = {
  summary: "accountSummary",
  platform: "platform",
  level: "level",
  teamStrength: "teamStrength",
  epics: "epics",
  epicPlayers: "epicPlayers",
};

const THEIR_ACCOUNT: AccountNames = {
  summary: "counterAccountSummary",
  platform: "counterPlatform",
  level: "counterLevel",
  teamStrength: "counterTeamStrength",
  epics: "counterEpics",
  epicPlayers: "counterEpicPlayers",
};

/**
 * Open a swap.
 *
 * Every deal is account-for-account, so there is no kind to choose and no price
 * to enter — both boxes are accounts, and the only question about money is that
 * there isn't any. The side choice remains, because it decides which of the two
 * descriptions is yours and therefore which side the invite leaves open.
 *
 * `minimumTeamStrength` is passed in rather than imported: the bar lives in
 * lib/referrals, which is server-only, and this file is not. The page hands it
 * down so the number on screen and the number the credit is checked against
 * cannot drift apart.
 */
export function CreateDealForm({
  locale,
  minimumTeamStrength,
}: {
  locale: Locale;
  minimumTeamStrength: number;
}) {
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

      {/* Asked once for the deal. Two accounts in different games cannot be
          swapped for each other, so this is the one fact that is not a pair. */}
      <div className="sm:max-w-56">
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
      </div>

      {/* The two halves of the swap, asked for in the same shape. The symmetry
          is the point: identical boxes on both sides are what stop one account
          being pinned down to the card and the other left as a sentence. */}
      <AccountCard
        legend={t("deal.summary.swapLabel")}
        summaryHint={t("deal.summary.hint")}
        summaryPlaceholder="eFootball 2026 mobile account. Original email included, no bans."
        names={YOUR_ACCOUNT}
        state={state}
        t={t}
      />

      <AccountCard
        legend={t("deal.counter.label")}
        summaryHint={t("deal.counter.hint")}
        summaryPlaceholder="eFootball 2026 PS5 account. Original email included, no bans."
        names={THEIR_ACCOUNT}
        state={state}
        t={t}
      />

      {/* Said once, here, where both cards have just been filled in. A rule
          about somebody else's $2 is not worth a banner, but leaving it unsaid
          would mean people find out by not being paid. */}
      <p className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5 text-xs leading-relaxed text-[var(--muted)]">
        {t("deal.strength.note").replace("{n}", String(minimumTeamStrength))}
      </p>

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
 * One side of the swap: a description, and the facts that can be checked.
 *
 * Written once and rendered twice, because the two accounts in a swap are
 * equal — each side is handing over something the other has to take on trust.
 * A form that asked four questions about one account and for a paragraph about
 * the other would say the opposite, and the thinner half is always the one the
 * admin cannot verify.
 *
 * Everything except the description is optional. The rating is the one that
 * decides money (see lib/referrals), and the epics are what the admin counts
 * inside the account before releasing anything.
 */
function AccountCard({
  legend,
  summaryHint,
  summaryPlaceholder,
  names,
  state,
  t,
}: {
  legend: string;
  summaryHint: string;
  summaryPlaceholder: string;
  names: AccountNames;
  state: FormState | undefined;
  t: Translate;
}) {
  const error = (name: string) => state?.fieldErrors?.[name];
  const value = (name: string) => state?.values?.[name] ?? "";

  /** Every input here is the same shape; only the label and hint change. */
  const box = (name: string, label: string, placeholder: string, hint?: string, numeric = false) => (
    <Field label={label} name={name} error={error(name)} hint={hint}>
      <input
        id={name}
        name={name}
        inputMode={numeric ? "numeric" : undefined}
        defaultValue={value(name)}
        aria-invalid={Boolean(error(name)) || undefined}
        aria-describedby={fieldDescribedBy(name, { hint, error: error(name) })}
        className={inputClassName}
        placeholder={placeholder}
      />
    </Field>
  );

  return (
    <fieldset className="rounded-[var(--radius-card)] border border-[var(--border)] p-4">
      <legend className="px-1.5 text-sm font-medium">{legend}</legend>

      <Field
        label={t("deal.account.description")}
        name={names.summary}
        error={error(names.summary)}
        hint={summaryHint}
      >
        <textarea
          id={names.summary}
          name={names.summary}
          required
          rows={3}
          defaultValue={value(names.summary)}
          aria-invalid={Boolean(error(names.summary)) || undefined}
          aria-describedby={fieldDescribedBy(names.summary, {
            hint: summaryHint,
            error: error(names.summary),
          })}
          className={inputClassName}
          placeholder={summaryPlaceholder}
        />
      </Field>

      {/* Said once above the row rather than four times inside it. */}
      <p className="mt-4 text-xs text-[var(--muted)]">{t("deal.account.allOptional")}</p>

      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {box(names.platform, t("deal.account.platform"), "Mobile, PS5, Xbox, PC")}
        {box(names.level, t("deal.account.level"), "42", undefined, true)}
        {box(names.teamStrength, t("deal.account.strength"), "3280", t("deal.strength.hint"), true)}
        {box(names.epics, t("deal.account.epics"), "5", t("deal.epics.hint"), true)}
      </div>

      {/* Its own row: a list of names needs the width, and it is the line the
          admin reads against the squad when checking the account. */}
      <div className="mt-4">
        {box(
          names.epicPlayers,
          t("deal.account.epicPlayers"),
          "Zidane, Henry, R9 Ronaldo",
          t("deal.epicPlayers.hint"),
        )}
      </div>
    </fieldset>
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
