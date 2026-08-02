"use client";

import { useActionState, useState } from "react";

import { createDealAction } from "@/app/actions/deal-actions";
import { splitDealMoney } from "@/lib/fees";
import { formatCents, parsePriceToCents } from "@/lib/money";
import { Button, Field, FormError, inputClassName } from "@/components/ui";

const SIDES = [
  {
    value: "seller",
    title: "I am selling",
    detail: "You hand over the account. You get paid once the buyer confirms.",
  },
  {
    value: "buyer",
    title: "I am buying",
    detail: "You pay into escrow. Your money is held until the account works.",
  },
] as const;

export function CreateDealForm({ feeBps }: { feeBps: number }) {
  const [state, formAction, pending] = useActionState(createDealAction, undefined);

  // Held in state purely to show the split as it is typed. The authoritative
  // numbers are recomputed on the server — this is a preview, not an input.
  const [side, setSide] = useState<string>(state?.values?.side ?? "seller");
  const [price, setPrice] = useState<string>(state?.values?.agreedPriceCents ?? "");

  const cents = parsePriceToCents(price);
  const split = cents === null ? null : splitDealMoney(cents, feeBps);

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state?.message} />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Your side of this deal</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SIDES.map((choice) => (
            <label
              key={choice.value}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 has-checked:border-emerald-500 has-checked:bg-emerald-500/10"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="side"
                  value={choice.value}
                  checked={side === choice.value}
                  onChange={(event) => setSide(event.target.value)}
                  className="accent-emerald-500"
                />
                <span className="text-sm font-medium">{choice.title}</span>
              </span>
              <span className="mt-1 block pl-6 text-xs text-[var(--muted)]">{choice.detail}</span>
            </label>
          ))}
        </div>
        {state?.fieldErrors?.side ? (
          <p className="mt-1.5 text-xs text-[var(--tone-danger)]">{state.fieldErrors.side}</p>
        ) : null}
      </fieldset>

      <Field
        label="What is being sold"
        name="accountSummary"
        error={state?.fieldErrors?.accountSummary}
        hint="Be specific. This is what the admin checks the account against before releasing it."
      >
        <textarea
          id="accountSummary"
          name="accountSummary"
          required
          rows={4}
          defaultValue={state?.values?.accountSummary ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.accountSummary)}
          className={inputClassName}
          placeholder="eFootball 2026 mobile account. 4 Legends (Messi, Ronaldinho, Zico, Kaka), squad rating 3200, original email included, no bans."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Game" name="game" error={state?.fieldErrors?.game}>
          <input
            id="game"
            name="game"
            required
            defaultValue={state?.values?.game ?? "eFootball"}
            aria-invalid={Boolean(state?.fieldErrors?.game)}
            className={inputClassName}
          />
        </Field>

        <Field label="Platform" name="platform" error={state?.fieldErrors?.platform} hint="Optional">
          <input
            id="platform"
            name="platform"
            defaultValue={state?.values?.platform ?? ""}
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
            aria-invalid={Boolean(state?.fieldErrors?.level)}
            className={inputClassName}
            placeholder="42"
          />
        </Field>
      </div>

      <Field
        label="Agreed price (USD)"
        name="agreedPriceCents"
        error={state?.fieldErrors?.agreedPriceCents}
        hint="The price you already agreed between yourselves."
      >
        <input
          id="agreedPriceCents"
          name="agreedPriceCents"
          inputMode="decimal"
          required
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          aria-invalid={Boolean(state?.fieldErrors?.agreedPriceCents)}
          className={inputClassName}
          placeholder="185.00"
        />
      </Field>

      {split ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            How the money splits
          </p>
          <dl className="space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Buyer pays</dt>
              <dd className="font-medium">{formatCents(split.agreedPriceCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Escrow fee</dt>
              <dd>−{formatCents(split.feeCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1.5">
              <dt className="text-[var(--muted)]">Seller receives</dt>
              <dd className="font-semibold text-[var(--accent)]">
                {formatCents(split.sellerPayoutCents)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating deal…" : "Create deal and get invite code"}
      </Button>

      <p className="text-center text-xs text-[var(--muted)]">
        Nothing is shared yet. You will get a code to send to the other person.
      </p>
    </form>
  );
}
