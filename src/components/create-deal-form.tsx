"use client";

import { useActionState, useState } from "react";

import { createDealAction } from "@/app/actions/deal-actions";
import { splitDealMoney } from "@/lib/fees";
import { formatCents, parsePriceToCents } from "@/lib/money";
import { NavIcon, type NavIconName } from "@/components/nav/nav-icons";
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
    title: "I am selling",
    detail: "You hand over the account. You get paid once the buyer confirms.",
    icon: "payout" as NavIconName,
  },
  {
    value: "buyer",
    title: "I am buying",
    detail: "You pay into escrow. Your money is held until the account works.",
    icon: "wallet" as NavIconName,
  },
] as const;

const SUMMARY_HINT =
  "Be specific. This is what the admin checks the account against before releasing it.";
const PRICE_HINT = "The price you already agreed between yourselves.";

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
export function CreateDealForm({ feeBps }: { feeBps: number }) {
  const [state, formAction, pending] = useActionState(createDealAction, undefined);

  // Held in state purely to show the split as it is typed. The authoritative
  // numbers are recomputed on the server — this is a preview, not an input.
  const [side, setSide] = useState<string>(state?.values?.side ?? "seller");
  const [price, setPrice] = useState<string>(state?.values?.agreedPriceCents ?? "");

  const cents = parsePriceToCents(price);
  const split = cents === null ? null : splitDealMoney(cents, feeBps);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.message} />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Your side of this deal</legend>

        <div className="grid gap-2 sm:grid-cols-2">
          {SIDES.map((choice) => {
            const selected = side === choice.value;

            return (
              <label
                key={choice.value}
                className={cn(
                  "cursor-pointer rounded-[var(--radius-card)] border p-3.5 transition-colors",
                  // The radio itself is sr-only, so the focus ring has to be
                  // drawn on the label instead — otherwise tabbing through this
                  // group shows nothing at all.
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]",
                  selected
                    ? "border-[var(--accent)] bg-[var(--tone-success-bg)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/40",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="side"
                    value={choice.value}
                    checked={selected}
                    onChange={(event) => setSide(event.target.value)}
                    className="sr-only"
                  />

                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] border transition-colors",
                      selected
                        ? "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)]",
                    )}
                  >
                    <NavIcon name={choice.icon} className="size-4" />
                  </span>

                  <span className="text-sm font-medium">{choice.title}</span>

                  {/* The tick is the only thing that changes shape, so the
                      selected card is not distinguished by colour alone. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "ms-auto grid size-4 shrink-0 place-items-center rounded-full border",
                      selected
                        ? "border-transparent bg-[var(--accent)] text-[var(--background)]"
                        : "border-[var(--border)]",
                    )}
                  >
                    {selected ? <TickIcon /> : null}
                  </span>
                </span>

                <span className="mt-1.5 block text-xs leading-relaxed text-[var(--muted)]">
                  {choice.detail}
                </span>
              </label>
            );
          })}
        </div>

        {state?.fieldErrors?.side ? (
          <p role="alert" className="mt-1.5 text-xs text-[var(--tone-danger)]">
            {state.fieldErrors.side}
          </p>
        ) : null}
      </fieldset>

      <Field
        label="What is being sold"
        name="accountSummary"
        error={state?.fieldErrors?.accountSummary}
        hint={SUMMARY_HINT}
      >
        <textarea
          id="accountSummary"
          name="accountSummary"
          required
          rows={4}
          defaultValue={state?.values?.accountSummary ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.accountSummary) || undefined}
          aria-describedby={fieldDescribedBy("accountSummary", {
            hint: SUMMARY_HINT,
            error: state?.fieldErrors?.accountSummary,
          })}
          className={inputClassName}
          placeholder="eFootball 2026 mobile account. 4 Legends (Messi, Ronaldinho, Zico, Kaka), squad rating 3200, original email included, no bans."
        />
      </Field>

      {/* Grouped rather than three loose inputs: only one of the three is
          required, and saying so once beats writing "Optional" twice. */}
      <fieldset className="rounded-[var(--radius-card)] border border-[var(--border)] p-4">
        <legend className="px-1.5 text-sm font-medium">The account itself</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Game" name="game" error={state?.fieldErrors?.game}>
            <input
              id="game"
              name="game"
              required
              defaultValue={state?.values?.game ?? "eFootball"}
              aria-invalid={Boolean(state?.fieldErrors?.game) || undefined}
              className={inputClassName}
            />
          </Field>

          <Field label="Platform" name="platform" error={state?.fieldErrors?.platform} hint="Optional">
            <input
              id="platform"
              name="platform"
              defaultValue={state?.values?.platform ?? ""}
              aria-describedby={fieldDescribedBy("platform", { hint: "Optional" })}
              className={inputClassName}
              placeholder="Mobile, PS5, Xbox, PC"
            />
          </Field>

          <Field label="Level" name="level" error={state?.fieldErrors?.level} hint="Optional">
            <input
              id="level"
              name="level"
              inputMode="numeric"
              defaultValue={state?.values?.level ?? ""}
              aria-invalid={Boolean(state?.fieldErrors?.level) || undefined}
              aria-describedby={fieldDescribedBy("level", {
                hint: "Optional",
                error: state?.fieldErrors?.level,
              })}
              className={inputClassName}
              placeholder="42"
            />
          </Field>
        </div>
      </fieldset>

      <Field
        label="Agreed price (USD)"
        name="agreedPriceCents"
        error={state?.fieldErrors?.agreedPriceCents}
        hint={PRICE_HINT}
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
              hint: PRICE_HINT,
              error: state?.fieldErrors?.agreedPriceCents,
            })}
            className={cn(inputClassName, "ps-7 tabular-nums")}
            placeholder="185.00"
          />
        </div>
      </Field>

      {split ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="text-overline uppercase text-[var(--muted)]">How the money splits</p>

          <dl className="mt-2.5 space-y-1.5 text-sm">
            <Split label="Buyer pays" value={formatCents(split.agreedPriceCents)} />
            <Split label="Escrow fee" value={`−${formatCents(split.feeCents)}`} />
            <div className="flex justify-between border-t border-[var(--border)] pt-1.5">
              <dt className="text-[var(--muted)]">Seller receives</dt>
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
          {pending ? "Creating deal…" : "Create deal and get invite code"}
        </Button>

        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          Nothing is shared yet. You will get a code to send to the other person.
        </p>
      </div>
    </form>
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
