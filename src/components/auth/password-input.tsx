"use client";

import { useId, useState } from "react";

import { cn, inputClassName } from "@/components/ui";

/**
 * A password box you can read back.
 *
 * The reveal toggle is an accessibility feature before it is a convenience: the
 * single most common reason a correct password is rejected is a typo nobody can
 * see, and the people most affected are those using a phone keyboard, a screen
 * magnifier, or a password they were given rather than chose.
 *
 * Three details that matter:
 *
 * The toggle is a real `<button type="button">`. Without the explicit type it
 * would default to `submit` and revealing the password would submit the form.
 *
 * Its state is announced with `aria-pressed`, not by swapping the accessible
 * name, so a screen reader says "show password, pressed" rather than silently
 * relabelling the control under the user's fingers.
 *
 * Caps Lock is reported from the keyboard event's modifier state, which needs
 * no permission and no key logging — the browser tells us the lock is on
 * without us inspecting which key was pressed.
 */
export function PasswordInput({
  name,
  autoComplete,
  required = true,
  minLength,
  invalid,
  describedBy,
  autoFocus,
  onValueChange,
}: {
  name: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  /** For the strength meter. The value itself is never lifted out of the DOM. */
  onValueChange?: (value: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const capsId = useId();

  return (
    <div>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={revealed ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          autoFocus={autoFocus}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, capsLock ? capsId : null].filter(Boolean).join(" ") || undefined}
          onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
          onKeyUp={(event) => setCapsLock(event.getModifierState?.("CapsLock") ?? false)}
          onBlur={() => setCapsLock(false)}
          className={cn(inputClassName, "pr-11", revealed && "font-mono")}
          placeholder="••••••••"
        />

        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          aria-pressed={revealed}
          aria-label="Show password"
          title={revealed ? "Hide password" : "Show password"}
          // -translate-y-1/2 off a 50% top, so it stays centred whatever the
          // control's height ends up being.
          className={cn(
            "absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center",
            "rounded-[var(--radius-control)] text-[var(--muted)] transition-colors",
            "hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
          )}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {capsLock ? (
        <p id={capsId} className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--tone-warning)]">
          <WarningIcon />
          Caps Lock is on.
        </p>
      ) : null}
    </div>
  );
}

const ICON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-4",
};

function EyeIcon() {
  return (
    <svg {...ICON}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...ICON}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A8.9 8.9 0 0112 6c6 0 9.5 6 9.5 6a16 16 0 01-3.3 3.9M6.6 7.8A16 16 0 002.5 12S6 18 12 18a8.8 8.8 0 003.3-.6" />
      <path d="M9.9 10.1a2.8 2.8 0 004 3.9" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg {...ICON} className="size-3.5 shrink-0">
      <path d="M12 4.5l8.5 15h-17l8.5-15z" />
      <path d="M12 10v3.6" />
      <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
