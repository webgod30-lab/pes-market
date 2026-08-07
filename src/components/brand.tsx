import Link from "next/link";

import { cn } from "@/components/ui";

/**
 * The brand, in one place.
 *
 * This is variant 5c from the logo exploration — "clipped tag, status line".
 * The idea is a single piece of geometry used at every size: a rectangle with
 * its bottom-right corner cut off, like a stamped tag or a HUD panel. At
 * wordmark size it holds "PES"; at icon size it holds "PE"; at favicon size it
 * survives as the silhouette alone.
 *
 * Everything that draws the brand draws it from here — except the two places
 * that physically cannot import (see the notes on CLIP_* below).
 */

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

export const BRAND = {
  /** Neon emerald. The mark's fill on dark, and the accent throughout. */
  emerald: "#3ef2a0",
  /** Darker emerald, for the mark on a light ground where neon would glare. */
  emeraldDeep: "#17a86a",
  /** Near-black. The ground the mark sits on. */
  ink: "#0b0f12",
  /** One step up from ink — panels, the icon tile. */
  inkPanel: "#101619",
  /** Off-white. Type on dark, and the mark's fill when it must be neutral. */
  paper: "#eef7f3",
  /** Hairlines. */
  line: "#2b3a34",
  /** Secondary type — the status line under the wordmark. */
  muted: "#7d8f88",
} as const;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/**
 * The clip. Two of them, because the proportion differs with the shape.
 *
 * On the wide "PES" tag the cut starts at 68% of the height; on the square icon
 * it starts at 72%, which keeps the diagonal at a similar angle rather than
 * scaling with the box. Copied verbatim from the design so the two match.
 */
export const CLIP_TAG = "polygon(0 0, 100% 0, 100% 68%, 82% 100%, 0 100%)";
export const CLIP_ICON = "polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)";

/**
 * The same square clip as an SVG path, on a 64-unit grid.
 *
 * `clip-path` is CSS and does not exist inside a standalone .svg file or inside
 * satori, which renders the generated icons. Those need real geometry, so the
 * shape is written out once here and mirrored in src/app/icon.svg — the browser
 * fetches that file directly and it cannot import from this module. Change one,
 * change the other.
 */
export const ICON_TAG_PATH = "M0 0 H64 V46 L46 64 H0 Z";

/**
 * "PE", drawn rather than typeset.
 *
 * The wordmark uses Chakra Petch, but the icon cannot: a favicon does not
 * reliably load a webfont, and satori would need the font binary shipped with
 * it. Paths render identically everywhere with no font at all. Cut square, to
 * echo Chakra Petch's flat terminals.
 *
 * Deliberately heavier than the wordmark's letterforms. The first version was
 * drawn at the wordmark's proportions and rasterised to mush in a browser tab —
 * the P's counter and the gaps between the E's arms both landed under a pixel
 * at 32px. Stems are 7 units of 64 and the counters 6, which survives down to
 * 16px. It also matches the design's own icon application, where the letters
 * nearly fill the tag.
 */
export const PE_PATH =
  // P — stem, top bar, the bowl's right edge, and the bar that closes it.
  "M7 12 h7 v32 h-7 z M14 12 h13 v7 h-13 z M20 19 h7 v7 h-7 z M14 26 h13 v7 h-13 z " +
  // E — stem and three arms, the middle one short.
  "M33 12 h7 v32 h-7 z M40 12 h16 v7 h-16 z M40 24.5 h12 v7 h-12 z M40 37 h16 v7 h-16 z";

// ---------------------------------------------------------------------------
// The mark
// ---------------------------------------------------------------------------

/**
 * The square mark: a clipped tag holding "PE".
 *
 * `tone` picks which way round it sits. Emerald on ink is the default and the
 * one used almost everywhere; `paper` is the quiet version for a light surface
 * that already has enough green on it.
 */
export function BrandMark({
  size = 28,
  tone = "emerald",
  className = "",
}: {
  size?: number;
  tone?: "emerald" | "paper";
  className?: string;
}) {
  // --brand-mark, not --accent. The mark is a filled shape, not text, so it is
  // free to use the design's full neon on dark; the text accent is a separate
  // token because it has a contrast ratio to meet and cannot be that bright on
  // white. On light the token resolves to the design's deeper green, which is
  // the substitution the design itself makes for its light application.
  const fill = tone === "emerald" ? "var(--brand-mark)" : BRAND.paper;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_TAG_PATH} fill={fill} />
      {/* Always ink, never the page background: the counter has to stay dark
          against the fill in both themes. */}
      <path d={PE_PATH} fill={BRAND.ink} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The wordmark
// ---------------------------------------------------------------------------

/**
 * PES in the tag, ESCROW beside it.
 *
 * Real type rather than paths, so the name stays selectable, searchable and
 * readable by a screen reader without an alt attribute standing in for it.
 *
 * The tag's emerald is a token, not a constant: on the dark theme it is the
 * neon `--accent`, and on light it resolves to the deeper green — the same
 * substitution the design makes between its dark board and its light
 * application. Text on the tag is always ink.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={cn("font-display flex items-stretch gap-[0.18em] leading-none", className)}>
      <span
        className="bg-[var(--accent)] px-[0.32em] pb-[0.28em] pt-[0.22em] font-bold tracking-[0.02em] text-[var(--background)]"
        style={{ clipPath: CLIP_TAG }}
      >
        PES
      </span>
      <span className="pb-[0.28em] pt-[0.22em] font-bold tracking-[0.02em]">ESCROW</span>
    </span>
  );
}

/**
 * The status line that sits under the wordmark in the design.
 *
 * Only used where there is vertical room for it — the auth pages and the
 * footer. The header is 56px tall and has none.
 */
export function StatusLine({ children = "Escrow service" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 border border-[var(--border)] px-2.5 py-1.5">
      <span aria-hidden="true" className="size-[7px] shrink-0 bg-[var(--accent)]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {children}
      </span>
    </span>
  );
}

/**
 * The lockup used in the header and the footer: wordmark only.
 *
 * No mark beside it. The wordmark already opens with the clipped tag, so
 * setting the square tag next to it repeated the same shape twice in 150px and
 * read as two logos rather than one. The mark still carries the brand where
 * there is no room for words — the favicon, the iOS icon, the auth pages.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center", className)}>
      <Wordmark />
    </span>
  );
}

/** The lockup as a link home. Carries the accessible name for the whole thing. */
export function LogoLink() {
  return (
    // inline-flex so the link hugs the wordmark. As a plain inline <a> around a
    // block-level lockup it stretched to the width of its column in the footer,
    // which made 240px of empty space navigate home.
    <Link
      href="/"
      aria-label="PESescrow.com — home"
      className="inline-flex rounded-[var(--radius-control)]"
    >
      <Logo className="text-sm sm:text-base" />
    </Link>
  );
}
