"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  beginTotpAction,
  confirmTotpAction,
  disableTotpAction,
  type EnrolmentState,
} from "@/app/actions/security-actions";
import { Alert, Button, Field, FormError, inputClassName, Skeleton } from "@/components/ui";
import { TWO_FACTOR_SETUP } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";

/**
 * Enrolment, in the order it has to happen: get a secret, prove you can read a
 * code from it, then — and only then — it is switched on and the recovery
 * codes appear.
 *
 * The QR is rendered server-side and handed in as a data URI, so no QR library
 * ships to the browser and no secret is ever put in a URL.
 */
export function TwoFactorSetup({
  enabled,
  recoveryCodesLeft,
  qrFor,
  locale = "en",
}: {
  enabled: boolean;
  recoveryCodesLeft: number;
  qrFor: (uri: string) => Promise<string>;
  locale?: Locale;
}) {
  if (enabled) {
    return <DisablePanel recoveryCodesLeft={recoveryCodesLeft} locale={locale} />;
  }

  return <EnrolPanel qrFor={qrFor} locale={locale} />;
}

function EnrolPanel({ qrFor, locale }: { qrFor: (uri: string) => Promise<string>; locale: Locale }) {
  const copy = TWO_FACTOR_SETUP[locale];
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | undefined>();
  const [starting, startTransition] = useTransition();

  const [state, confirmAction, confirming] = useActionState<EnrolmentState | undefined, FormData>(
    confirmTotpAction,
    undefined,
  );

  function start() {
    startTransition(async () => {
      const result = await beginTotpAction();

      if (!result.setup) {
        setStartError(result.message ?? "Could not start setup.");
        return;
      }

      setStartError(undefined);
      setSetup(result.setup);
      setQr(await qrFor(result.setup.uri));
    });
  }

  // Enrolment finished: this is the only moment the recovery codes exist in
  // readable form.
  if (state?.recoveryCodes) {
    return <RecoveryCodes codes={state.recoveryCodes} locale={locale} />;
  }

  if (!setup) {
    return (
      <div>
        <FormError message={startError} />
        <p className="mb-4 text-sm text-[var(--muted)]">{copy.appHint}</p>
        <Button type="button" onClick={start} disabled={starting}>
          {starting ? copy.settingUp : copy.turnOn}
        </Button>
      </div>
    );
  }

  return (
    <form action={confirmAction} className="space-y-5">
      <FormError message={state?.message} />

      <div>
        <p className="text-sm font-medium">{copy.scanTitle}</p>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt="QR code for setting up two-factor authentication"
            className="mt-3 size-44 rounded-lg bg-white p-2"
          />
        ) : (
          <Skeleton className="mt-3 size-44" />
        )}

        <p className="mt-3 text-xs text-[var(--muted)]">{copy.cannotScan}</p>
        <code className="mt-1 block break-all rounded-md bg-[var(--surface-2)] px-3 py-2 font-mono text-xs">
          {setup.secret}
        </code>
      </div>

      <Field label={copy.codeLabel} name="token" error={state?.fieldErrors?.token} hint={copy.codeHint}>
        <input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={8}
          className={`${inputClassName} font-mono tracking-widest`}
          placeholder="123456"
        />
      </Field>

      <Button type="submit" disabled={confirming}>
        {confirming ? copy.checking : copy.confirmAndTurnOn}
      </Button>
    </form>
  );
}

function RecoveryCodes({ codes, locale }: { codes: string[]; locale: Locale }) {
  const copy = TWO_FACTOR_SETUP[locale];
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const router = useRouter();

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <Alert tone="success">{copy.onAlert}</Alert>

      <h3 className="mt-5 text-sm font-semibold">{copy.saveNowTitle}</h3>
      <p className="mt-1.5 text-sm text-[var(--muted)]">{copy.saveNowBody}</p>

      <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="rounded-md bg-[var(--surface-2)] px-3 py-2 tracking-wider">
            {code}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={copyCodes}
        className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-2)]"
      >
        {copied ? copy.copied : copy.copyAll}
      </button>

      <p className="mt-4 text-xs text-[var(--muted)]">{copy.wontShowAgain}</p>

      {/* The page is only refreshed once this is ticked. Refreshing earlier
          re-renders the server component with two-factor now on, which
          replaces this whole panel — and the codes are gone for good. */}
      <label className="mt-5 flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-emerald-500"
        />
        <span>{copy.acknowledge}</span>
      </label>

      <Button
        type="button"
        className="mt-4"
        disabled={!acknowledged}
        onClick={() => router.refresh()}
      >
        {copy.done}
      </Button>
    </div>
  );
}

function DisablePanel({ recoveryCodesLeft, locale }: { recoveryCodesLeft: number; locale: Locale }) {
  const [state, action, pending] = useActionState(disableTotpAction, undefined);
  const [confirming, setConfirming] = useState(false);
  const copy = TWO_FACTOR_SETUP[locale];

  return (
    <div>
      <Alert tone="success">{copy.onForAccount}</Alert>

      <p className="mt-4 text-sm text-[var(--muted)]">
        {copy.codesLeft(recoveryCodesLeft)}
        {recoveryCodesLeft === 0 ? copy.codesNone : recoveryCodesLeft <= 2 ? copy.codesLow : ""}
      </p>

      {confirming ? (
        <form action={action} className="mt-5 space-y-4">
          <FormError message={state?.message} />

          <Field
            label={copy.confirmPasswordLabel}
            name="password"
            error={state?.fieldErrors?.password}
            hint={copy.confirmPasswordHint}
          >
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClassName}
              placeholder="••••••••"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? copy.turningOff : copy.turnOff}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
              {copy.keepOn}
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 text-sm text-[var(--tone-danger)] hover:underline"
        >
          {copy.turnOff}
        </button>
      )}
    </div>
  );
}
