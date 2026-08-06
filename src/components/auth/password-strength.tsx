"use client";

import { cn } from "@/components/ui";

/**
 * How strong the password looks, as advice.
 *
 * This is a hint, not a gate. What is actually accepted is decided by
 * registerSchema on the server — 8 to 72 characters — and nothing here changes
 * that. A meter that silently enforces its own stricter rule is a form that
 * rejects a password for a reason it never stated.
 *
 * The scoring is deliberately crude: length, then variety, then a check against
 * the handful of passwords that show up in every breach list. It is not an
 * entropy estimate and does not pretend to be one, which is why the labels talk
 * about how it looks rather than how many years it would take to crack.
 *
 * The 72-character ceiling is real and worth surfacing: bcrypt ignores bytes
 * past 72, so a longer password is silently truncated by the algorithm. The
 * schema rejects those rather than truncating, and saying so here means someone
 * pasting a long passphrase finds out before they submit.
 */

/** Not a breach list — just the shapes people reach for when asked to invent one. */
const OBVIOUS = [
  "password",
  "12345678",
  "123456789",
  "qwerty",
  "letmein",
  "iloveyou",
  "admin",
  "welcome",
  "football",
  "efootball",
  "konami",
  "escrow",
];

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; advice?: string };

export function scorePassword(value: string): Strength {
  if (value.length === 0) return { score: 0, label: "" };

  const lower = value.toLowerCase();

  if (OBVIOUS.some((word) => lower.includes(word))) {
    return {
      score: 1,
      label: "Too guessable",
      advice: "This contains a word that appears in every password list there is.",
    };
  }

  if (value.length < 8) {
    return { score: 1, label: "Too short", advice: "Needs at least 8 characters." };
  }

  if (value.length > 72) {
    return {
      score: 1,
      label: "Too long",
      advice: "Maximum 72 characters — anything past that is ignored by the hashing algorithm.",
    };
  }

  // Variety counted as classes present, which is a rough stand-in for how much
  // of the keyboard an attacker has to search.
  const classes =
    Number(/[a-z]/.test(value)) +
    Number(/[A-Z]/.test(value)) +
    Number(/\d/.test(value)) +
    Number(/[^A-Za-z0-9]/.test(value));

  // Length does more work than variety, so it dominates the score.
  if (value.length >= 16 && classes >= 2) return { score: 4, label: "Strong" };
  if (value.length >= 12 && classes >= 2) return { score: 3, label: "Good" };
  if (value.length >= 10 || classes >= 3) return { score: 2, label: "Fair" };

  return {
    score: 1,
    label: "Weak",
    advice: "A longer password beats a complicated short one.",
  };
}

const BAR_TONE = [
  "bg-[var(--border)]",
  "bg-[var(--tone-danger)]",
  "bg-[var(--tone-warning)]",
  "bg-[var(--accent)]",
  "bg-[var(--accent)]",
] as const;

const TEXT_TONE = [
  "text-[var(--muted)]",
  "text-[var(--tone-danger)]",
  "text-[var(--tone-warning)]",
  "text-[var(--accent)]",
  "text-[var(--accent)]",
] as const;

export function PasswordStrength({ value }: { value: string }) {
  const { score, label, advice } = scorePassword(value);

  return (
    <div className="mt-2">
      <div aria-hidden="true" className="flex gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
              segment <= score ? BAR_TONE[score] : "bg-[var(--border)]",
            )}
          />
        ))}
      </div>

      {/* Polite, not assertive: this updates on nearly every keystroke, and an
          assertive region would interrupt the letters being typed. */}
      <p aria-live="polite" className="mt-1.5 min-h-4 text-xs">
        {label ? (
          <>
            <span className={cn("font-medium", TEXT_TONE[score])}>{label}</span>
            {advice ? <span className="text-[var(--muted)]"> — {advice}</span> : null}
          </>
        ) : null}
      </p>
    </div>
  );
}
