import Link from "next/link";

import { cn } from "@/components/ui/tone";

/**
 * The brand.
 *
 * One module owns the emblem geometry and the palette, and everything else —
 * header, footer, favicon, home-screen icon, social card, the escrow diagram —
 * draws from here. Before this, the shield existed as four hand-copied path
 * strings that had already drifted apart.
 *
 * What the mark is trying to say, in order of how quickly it should land:
 *
 *   shield    the money and the account are protected
 *   keyhole   they are locked, and only released deliberately
 *   dark      this handles money; a bright green square reads as a game, not
 *             a place you would leave $300 overnight
 *
 * The one hard constraint is the browser tab. At 16 pixels a thin outline or a
 * letterform turns to mush, so the mark is a solid tile with shapes knocked
 * out of it — a silhouette that survives being tiny, which is where most
 * people meet a brand most often.
 */

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
//
// Fixed hex, not theme variables. The mark has to be the same colour in a
// browser tab, on an iOS home screen and in a Discord preview — none of which
// know anything about this site's light and dark themes.

export const BRAND = {
  /** Deep emerald-teal. The ground the emblem sits on. */
  vault: "#04241d",
  vaultDeep: "#021712",
  /** The luminous emerald the shield is drawn in. */
  emerald: "#34d399",
  emeraldDeep: "#10b981",
  /** Page background used by the generated social card. */
  ink: "#0b0f14",
  paper: "#e7edf4",
  muted: "#8ba39c",
} as const;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
//
// Drawn on a 64×64 grid. Both paths are exported because the static
// `src/app/icon.svg` cannot import from a module — it is a file the browser
// fetches directly — so it carries a copy, and its comment points back here.
// If either changes, both change.

/** The shield outline: flat shoulders, straight flanks, a rounded point. */
export const SHIELD_PATH =
  "M32 9 L50 15.5 V32.5 C50 42 42.6 49.8 32 55 C21.4 49.8 14 42 14 32.5 V15.5 Z";

/** An inset copy, stroked faintly, so the shield reads as formed rather than flat. */
export const SHIELD_INNER_PATH =
  "M32 14 L45.5 19 V32.5 C45.5 39.5 40 45.6 32 49.8 C24 45.6 18.5 39.5 18.5 32.5 V19 Z";

/** Keyhole stem. The bow is a circle, placed separately. */
export const KEYHOLE_STEM_PATH = "M29.6 30.4 h4.8 l-1.3 9.8 h-2.2 z";
export const KEYHOLE_BOW = { cx: 32, cy: 27, r: 5.4 };

// ---------------------------------------------------------------------------
// The emblem
// ---------------------------------------------------------------------------

/**
 * The shield on its own, no tile.
 *
 * `tone="current"` draws it in the surrounding text colour, for places that
 * are already inside a themed context — the escrow diagram, an inline bullet.
 * `tone="brand"` uses the fixed brand emerald.
 */
export function ShieldEmblem({
  size = 40,
  tone = "brand",
  knockout = BRAND.vault,
  className = "",
  title,
}: {
  size?: number;
  tone?: "brand" | "current";
  /** What shows through the keyhole. Match whatever sits behind the shield. */
  knockout?: string;
  className?: string;
  /** Give this only when the emblem is the sole label for something. */
  title?: string;
}) {
  const brand = tone === "brand";
  const id = `shield-${tone}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {brand ? (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND.emerald} />
            <stop offset="100%" stopColor={BRAND.emeraldDeep} />
          </linearGradient>
        </defs>
      ) : null}

      <path d={SHIELD_PATH} fill={brand ? `url(#${id})` : "currentColor"} />

      {/* Bevel. Invisible by the time the mark is 16px, which is intended —
          it is the detail that makes the large sizes look considered. */}
      <path
        d={SHIELD_INNER_PATH}
        fill="none"
        stroke={brand ? BRAND.vaultDeep : "currentColor"}
        strokeOpacity={brand ? 0.22 : 0.18}
        strokeWidth="1.5"
      />

      <circle {...KEYHOLE_BOW} fill={brand ? knockout : "currentColor"} fillOpacity={brand ? 1 : 0.25} />
      <path d={KEYHOLE_STEM_PATH} fill={brand ? knockout : "currentColor"} fillOpacity={brand ? 1 : 0.25} />
    </svg>
  );
}

/**
 * The emblem on its tile — the app-icon form, and what the favicon shows.
 *
 * A dark ground rather than a bright one. This is a service that holds other
 * people's money, and the visual vocabulary for that is closer to a bank card
 * than to a game launcher.
 */
export function BrandMark({
  size = 28,
  className = "",
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id="brand-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BRAND.vault} />
          <stop offset="100%" stopColor={BRAND.vaultDeep} />
        </linearGradient>
        <linearGradient id="brand-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND.emerald} />
          <stop offset="100%" stopColor={BRAND.emeraldDeep} />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="15" fill="url(#brand-tile)" />
      {/* A hairline edge, so the tile still has a boundary on a dark page. */}
      <rect
        x="0.75"
        y="0.75"
        width="62.5"
        height="62.5"
        rx="14.25"
        fill="none"
        stroke={BRAND.emerald}
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />

      <path d={SHIELD_PATH} fill="url(#brand-shield)" />
      <path
        d={SHIELD_INNER_PATH}
        fill="none"
        stroke={BRAND.vaultDeep}
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      <circle {...KEYHOLE_BOW} fill={BRAND.vault} />
      <path d={KEYHOLE_STEM_PATH} fill={BRAND.vault} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Wordmark
// ---------------------------------------------------------------------------

/**
 * PESescrow.com, set as real text.
 *
 * Text rather than a drawn logotype so it is selectable, searchable, indexed,
 * and readable by a screen reader without an alt attribute standing in for it.
 *
 * The three parts are weighted deliberately: PES is the game, escrow is the
 * product and takes the accent, and .com sits back — it belongs to the name
 * but should not compete with it.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight whitespace-nowrap", className)}>
      PES<span className="text-[var(--accent)]">escrow</span>
      <span className="font-normal text-[var(--muted)]">.com</span>
    </span>
  );
}

/** Mark plus wordmark. */
export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2.5", className)}>
      <BrandMark size={size} />
      <Wordmark />
    </span>
  );
}

/** The lockup as a link home. Carries the accessible name for the whole thing. */
export function LogoLink({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" aria-label="PESescrow.com — home" className="rounded-[var(--radius-control)]">
      <Logo size={size} className="text-sm sm:text-base" />
    </Link>
  );
}
