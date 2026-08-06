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
}: {
  enabled: boolean;
  recoveryCodesLeft: number;
  qrFor: (uri: string) => Promise<string>;
}) {
  if (enabled) {
    return <DisablePanel recoveryCodesLeft={recoveryCodesLeft} />;
  }

  return <EnrolPanel qrFor={qrFor} />;
}

function EnrolPanel({ qrFor }: { qrFor: (uri: string) => Promise<string> }) {
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
    return <RecoveryCodes codes={state.recoveryCodes} />;
  }

  if (!setup) {
    return (
      <div>
        <FormError message={startError} />
        <p className="mb-4 text-sm text-[var(--muted)]">
          You will need an authenticator app — Google Authenticator, Aegis, 1Password, Bitwarden and
          most password managers all work.
        </p>
        <Button type="button" onClick={start} disabled={starting}>
          {starting ? "Setting up…" : "Turn on two-factor"}
        </Button>
      </div>
    );
  }

  return (
    <form action={confirmAction} className="space-y-5">
      <FormError message={state?.message} />

      <div>
        <p className="text-sm font-medium">1. Scan this with your authenticator app</p>
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

        <p className="mt-3 text-xs text-[var(--muted)]">
          Cannot scan? Enter this key by hand:
        </p>
        <code className="mt-1 block break-all rounded-md bg-[var(--surface-2)] px-3 py-2 font-mono text-xs">
          {setup.secret}
        </code>
      </div>

      <Field
        label="2. Enter the code it shows"
        name="token"
        error={state?.fieldErrors?.token}
        hint="Six digits. This proves the app is set up before we switch anything on."
      >
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
        {confirming ? "Checking…" : "Confirm and turn on"}
      </Button>
    </form>
  );
}

function RecoveryCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const router = useRouter();

  async function copy() {
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
      <Alert tone="success">Two-factor is on.</Alert>

      <h3 className="mt-5 text-sm font-semibold">Save these recovery codes now</h3>
      <p className="mt-1.5 text-sm text-[var(--muted)]">
        Each one works once, in place of a code from your app. This service has no password reset
        yet, so if you lose your phone and have not kept these, nobody can get you back into your
        account — not even the admin. Print them or put them in a password manager.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="rounded-md bg-[var(--surface-2)] px-3 py-2 tracking-wider">
            {code}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={copy}
        className="mt-4 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-2)]"
      >
        {copied ? "Copied" : "Copy all"}
      </button>

      <p className="mt-4 text-xs text-[var(--muted)]">
        They will not be shown again. Reloading this page loses them.
      </p>

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
        <span>I have saved these somewhere I can get to without my phone.</span>
      </label>

      <Button
        type="button"
        className="mt-4"
        disabled={!acknowledged}
        onClick={() => router.refresh()}
      >
        Done
      </Button>
    </div>
  );
}

function DisablePanel({ recoveryCodesLeft }: { recoveryCodesLeft: number }) {
  const [state, action, pending] = useActionState(disableTotpAction, undefined);
  const [confirming, setConfirming] = useState(false);

  return (
    <div>
      <Alert tone="success">Two-factor is on for this account.</Alert>

      <p className="mt-4 text-sm text-[var(--muted)]">
        {recoveryCodesLeft} recovery code{recoveryCodesLeft === 1 ? "" : "s"} left.
        {recoveryCodesLeft === 0
          ? " None remain — if you lose your phone now you cannot get back in. Turn two-factor off and on again to issue a fresh set."
          : recoveryCodesLeft <= 2
            ? " Running low. Turn two-factor off and on again to issue a fresh set."
            : ""}
      </p>

      {confirming ? (
        <form action={action} className="mt-5 space-y-4">
          <FormError message={state?.message} />

          <Field
            label="Confirm your password"
            name="password"
            error={state?.fieldErrors?.password}
            hint="Asked for so that someone who finds your screen unlocked cannot simply strip it off."
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
              {pending ? "Turning off…" : "Turn off two-factor"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
              Keep it on
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 text-sm text-[var(--tone-danger)] hover:underline"
        >
          Turn off two-factor
        </button>
      )}
    </div>
  );
}
