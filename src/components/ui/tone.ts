// The five semantic states, and the classes that express each one.
//
// Everything tinted — badges, alerts, timeline steps, callouts — reads its
// colours from here. Before this existed the same four states were written by
// hand as Tailwind opacity pairs, and eleven different combinations were in
// use: border-amber-500/30 next to border-amber-500/40 next to
// border-amber-500/20, all meaning "warning". Fixed pairings in one place mean
// a warning looks like every other warning, and a theme change lands
// everywhere at once.

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

/** Text only, for a label sitting on the page background. */
export const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-[var(--tone-neutral)]",
  success: "text-[var(--tone-success)]",
  warning: "text-[var(--tone-warning)]",
  danger: "text-[var(--tone-danger)]",
  info: "text-[var(--tone-info)]",
};

/** A tinted surface with a matching edge — the callout and badge treatment. */
export const TONE_SURFACE: Record<Tone, string> = {
  neutral: "border-[var(--tone-neutral-border)] bg-[var(--tone-neutral-bg)] text-[var(--tone-neutral)]",
  success: "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--tone-success)]",
  warning: "border-[var(--tone-warning-border)] bg-[var(--tone-warning-bg)] text-[var(--tone-warning)]",
  danger: "border-[var(--tone-danger-border)] bg-[var(--tone-danger-bg)] text-[var(--tone-danger)]",
  info: "border-[var(--tone-info-border)] bg-[var(--tone-info-bg)] text-[var(--tone-info)]",
};

/** Just the edge, for a card that needs flagging without being filled in. */
export const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-[var(--tone-neutral-border)]",
  success: "border-[var(--tone-success-border)]",
  warning: "border-[var(--tone-warning-border)]",
  danger: "border-[var(--tone-danger-border)]",
  info: "border-[var(--tone-info-border)]",
};

/**
 * Joins class strings, dropping anything falsy.
 *
 * Deliberately not `clsx`: the whole need is `cn("base", condition && "extra")`
 * and a dependency for six lines is a dependency to keep updated.
 */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
