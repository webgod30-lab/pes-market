import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/components/ui/tone";

/**
 * Shared control surface.
 *
 * Exported as a bare string as well as through the components below, because
 * a few call sites style a native element directly and there is no reason to
 * make them wrap it.
 */
export const inputClassName =
  "w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] " +
  // 16px on phones, 14px from `sm` up. Not a taste decision: iOS Safari zooms
  // the whole page when a focused input's text is under 16px, and the page does
  // not zoom back out afterwards. Every form in the app was doing this — most
  // visibly the login form, which is where people arrive on a phone.
  "px-3 py-2.5 text-base sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] " +
  "focus:border-[var(--accent)] focus:outline-none focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/**
 * The id of whichever small print is currently under a field, for the control's
 * `aria-describedby`.
 *
 * Field renders a hint and an error but cannot reach into `children` to wire
 * them up, so until a control opts in by calling this, neither is announced
 * when the field takes focus — a sighted user sees "At least 8 characters" and
 * a screen reader user hears nothing. Returns undefined when there is nothing
 * to point at, which is the correct value to spread onto the element.
 */
export function fieldDescribedBy(
  name: string,
  { hint, error }: { hint?: string; error?: string },
): string | undefined {
  if (error) return `${name}-error`;
  if (hint) return `${name}-hint`;
  return undefined;
}

/**
 * Label, control, hint and error, wired together.
 *
 * `name` doubles as the control's id, which is what connects the label. The
 * hint is hidden once there is an error: two lines of small print under one
 * field, one contradicting the other, is worse than either alone.
 *
 * Pass `aria-describedby={fieldDescribedBy(name, { hint, error })}` on the
 * control to have that small print announced as well as shown.
 */
export function Field({
  label,
  name,
  error,
  hint,
  labelSuffix,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  /** Sits opposite the label — "Forgot?" next to Password. */
  labelSuffix?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={name} className="block text-sm font-medium">
          {label}
        </label>
        {labelSuffix}
      </div>

      {children}

      {hint && !error ? (
        <p id={`${name}-hint`} className="mt-1.5 text-xs text-[var(--muted)]">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-[var(--tone-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A fieldset for a group of radios or checkboxes.
 *
 * A group needs its own name — a `<label>` per option says what each choice
 * is, but nothing says what the choice is *about*. A legend does that, and is
 * what a screen reader announces on entering the group.
 */
export function FieldGroup({
  legend,
  error,
  hint,
  children,
}: {
  legend: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">{legend}</legend>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-[var(--tone-danger)]">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * Text input.
 *
 * `invalid` sets aria-invalid rather than only colouring the border, so the
 * failure is announced and not merely shown.
 */
export function Input({
  className = "",
  invalid = false,
  mono = false,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean; mono?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        inputClassName,
        mono && "font-mono",
        invalid && "border-[var(--tone-danger)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  invalid = false,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(inputClassName, invalid && "border-[var(--tone-danger)]", className)}
      {...props}
    />
  );
}

export function Select({
  className = "",
  invalid = false,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(inputClassName, invalid && "border-[var(--tone-danger)]", className)}
      {...props}
    />
  );
}

/**
 * A search box that carries its own accessible name.
 *
 * The admin deals and users pages both had a bare input with a placeholder
 * and nothing else. A placeholder is not a label: it is unreliable for screen
 * readers and it disappears the moment someone types, so anyone who looks away
 * mid-search has lost what the field was for.
 */
export function SearchInput({
  label,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string }) {
  return (
    <input
      type="search"
      aria-label={label}
      className={cn(inputClassName, className)}
      {...props}
    />
  );
}

/**
 * A radio or checkbox rendered as a selectable chip.
 *
 * The real control stays in the DOM and is only visually hidden, so keyboard
 * and screen-reader behaviour is the native one. Selection has to survive
 * `forced-colors`, where background tints are discarded — hence the border
 * carrying the state as well as the fill.
 */
export function ChoiceChip({
  checked,
  children,
  className = "",
  ...props
}: ComponentProps<"input"> & { checked: boolean; children: ReactNode }) {
  return (
    <label
      className={cn(
        "cursor-pointer rounded-[var(--radius-control)] border px-3 py-2 text-sm transition-colors",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]",
        checked
          ? "border-[var(--accent)] bg-[var(--tone-success-bg)] text-[var(--tone-success)]"
          : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]",
        className,
      )}
    >
      <input checked={checked} className="sr-only" {...props} />
      {children}
    </label>
  );
}
