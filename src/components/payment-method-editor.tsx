"use client";

import { useActionState, useState } from "react";

import { savePaymentMethodAction, togglePaymentMethodAction } from "@/app/actions/admin-actions";
import type { PaymentMethodView } from "@/lib/payment-methods";
import { Badge, Button, Card, Field, FormError, inputClassName } from "@/components/ui";

const METHOD_TYPES = [
  { value: "crypto", label: "Crypto" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
] as const;

/** Create or edit one of the manual payment methods buyers are shown. */
export function PaymentMethodForm({
  existing,
  providers,
}: {
  existing?: PaymentMethodView;
  providers: { name: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(savePaymentMethodAction, undefined);
  const [method, setMethod] = useState<string>(existing?.method ?? "crypto");
  const [isAutomatic, setIsAutomatic] = useState(existing?.isAutomatic ?? false);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.message} />

      {existing ? <input type="hidden" name="id" value={existing.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" name={`method-${existing?.id ?? "new"}`} error={state?.fieldErrors?.method}>
          <select
            id={`method-${existing?.id ?? "new"}`}
            name="method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            className={inputClassName}
          >
            {METHOD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Name buyers see"
          name={`label-${existing?.id ?? "new"}`}
          error={state?.fieldErrors?.label}
        >
          <input
            id={`label-${existing?.id ?? "new"}`}
            name="label"
            required
            defaultValue={existing?.label ?? ""}
            className={inputClassName}
            placeholder="USDT (TRC-20)"
          />
        </Field>
      </div>

      {method === "crypto" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Wallet address"
            name={`walletAddress-${existing?.id ?? "new"}`}
            error={state?.fieldErrors?.walletAddress}
            hint="Buyers copy this. Check it character by character."
          >
            <input
              id={`walletAddress-${existing?.id ?? "new"}`}
              name="walletAddress"
              defaultValue={existing?.walletAddress ?? ""}
              className={`${inputClassName} font-mono`}
            />
          </Field>

          <Field
            label="Network"
            name={`network-${existing?.id ?? "new"}`}
            error={state?.fieldErrors?.network}
            hint="Sending on the wrong network loses the money."
          >
            <input
              id={`network-${existing?.id ?? "new"}`}
              name="network"
              defaultValue={existing?.network ?? ""}
              className={inputClassName}
              placeholder="TRON / TRC-20"
            />
          </Field>
        </div>
      ) : null}

      <Field
        label="Instructions"
        name={`instructions-${existing?.id ?? "new"}`}
        error={state?.fieldErrors?.instructions}
      >
        <textarea
          id={`instructions-${existing?.id ?? "new"}`}
          name="instructions"
          rows={3}
          required
          defaultValue={existing?.instructions ?? ""}
          className={inputClassName}
        />
      </Field>

      {/* --- automatic confirmation --- */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isAutomatic"
            checked={isAutomatic}
            onChange={(event) => setIsAutomatic(event.target.checked)}
            className="accent-emerald-500"
          />
          Confirm payments automatically
        </label>
        <p className="mt-1 ps-6 text-xs text-[var(--muted)]">
          A provider tells us when the money lands, and the deal moves to verification on its own.
          Leave this off to keep checking payments yourself.
        </p>

        {isAutomatic ? (
          <div className="mt-3 ps-6">
            <label
              htmlFor={`provider-${existing?.id ?? "new"}`}
              className="mb-1.5 block text-xs font-medium"
            >
              Provider
            </label>
            <select
              id={`provider-${existing?.id ?? "new"}`}
              name="provider"
              defaultValue={existing?.provider ?? providers[0]?.name ?? ""}
              className={inputClassName}
            >
              {providers.map((provider) => (
                <option key={provider.name} value={provider.name}>
                  {provider.label}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.provider ? (
              <p className="mt-1.5 text-xs text-[var(--tone-danger)]">{state.fieldErrors.provider}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Sort order"
          name={`sortOrder-${existing?.id ?? "new"}`}
          error={state?.fieldErrors?.sortOrder}
          hint="Lower shows first."
        >
          <input
            id={`sortOrder-${existing?.id ?? "new"}`}
            name="sortOrder"
            inputMode="numeric"
            defaultValue={String(existing?.sortOrder ?? 0)}
            className={inputClassName}
          />
        </Field>

        <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={existing?.isActive ?? true}
            className="accent-emerald-500"
          />
          Show this to buyers
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : existing ? "Save changes" : "Add payment method"}
      </Button>
    </form>
  );
}

/** Quick active/inactive switch on the list. */
export function TogglePaymentMethod({ method }: { method: PaymentMethodView }) {
  const [state, formAction, pending] = useActionState(togglePaymentMethodAction, undefined);

  return (
    <form action={formAction} className="inline">
      <FormError message={state?.message} />
      <input type="hidden" name="id" value={method.id} />
      <input type="hidden" name="isActive" value={method.isActive ? "false" : "true"} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "…" : method.isActive ? "Hide from buyers" : "Show to buyers"}
      </Button>
    </form>
  );
}

/** One row in the settings list, expandable to edit. */
export function PaymentMethodRow({
  method,
  providers,
}: {
  method: PaymentMethodView;
  providers: { name: string; label: string }[];
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{method.label}</span>
            <Badge tone={method.isActive ? "success" : "neutral"}>
              {method.isActive ? "visible to buyers" : "hidden"}
            </Badge>
            {method.isAutomatic ? (
              <Badge tone="info">automatic · {method.provider}</Badge>
            ) : (
              <Badge tone="neutral">you confirm by hand</Badge>
            )}
          </div>
          {method.walletAddress ? (
            <p className="mt-1.5 break-all font-mono text-xs text-[var(--muted)]">
              {method.walletAddress}
              {method.network ? ` · ${method.network}` : ""}
            </p>
          ) : null}
        </div>
        <TogglePaymentMethod method={method} />
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-[var(--muted)]">Edit</summary>
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <PaymentMethodForm existing={method} providers={providers} />
        </div>
      </details>
    </Card>
  );
}
