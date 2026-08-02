// Original drawn graphics. SERVER-SAFE — no state, no effects.
//
// Everything here is inline SVG rather than image files, for three reasons:
// it stays sharp at any size, it costs no extra network request, and it can
// paint itself with currentColor and the theme variables, so one drawing works
// on both the light and the dark palette.
//
// Nothing in this file depends on a game publisher's artwork.
import type { ReactNode } from "react";

/**
 * The whole product in one picture: money in on one side, held in the middle,
 * account out the other, and nothing crosses until the middle says so.
 *
 * Two drawings rather than one that scales. A 560-wide viewBox squeezed into a
 * phone renders its 10px labels at about 6px, which is decoration pretending to
 * be information — so narrow screens get a stacked version drawn at a viewBox
 * they nearly fill, and the text stays its intended size.
 *
 * Deliberately not animated: this sits above the fold on the landing page, and
 * a looping animation there reads as a banner ad.
 */
export function EscrowDiagram({ className = "" }: { className?: string }) {
  return (
    <>
      <EscrowDiagramWide className={`hidden sm:block ${className}`} />
      <EscrowDiagramStacked className={`sm:hidden ${className}`} />
    </>
  );
}

function EscrowDiagramWide({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 240"
      className={className}
      role="img"
      aria-label="The buyer's money and the seller's account are both held by escrow until the trade is proven, then released to the other side."
      fill="none"
    >
      <defs>
        <linearGradient id="esc-flow-in" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="esc-flow-out" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* the two sides */}
      <PartyNode x={12} y={64} label="Buyer" sub="pays in" />
      <PartyNode x={412} y={64} label="Seller" sub="paid out" />

      {/* flow lines */}
      <path d="M148 112 H208" stroke="url(#esc-flow-in)" strokeWidth="2" strokeLinecap="round" />
      <path d="M352 112 H412" stroke="url(#esc-flow-out)" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M148 128 H208"
        stroke="var(--border)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <path
        d="M352 128 H412"
        stroke="var(--border)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />

      {/* the vault in the middle */}
      <rect
        x={208}
        y={52}
        width={144}
        height={136}
        rx={20}
        fill="var(--surface)"
        stroke="var(--accent)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <rect
        x={208}
        y={52}
        width={144}
        height={136}
        rx={20}
        fill="var(--accent)"
        fillOpacity="0.05"
      />

      <g transform="translate(256, 76)">
        <ShieldGlyph />
      </g>

      <text
        x={280}
        y={158}
        textAnchor="middle"
        fill="var(--foreground)"
        fontSize="13"
        fontWeight="600"
        fontFamily="inherit"
      >
        Held in escrow
      </text>
      <text
        x={280}
        y={175}
        textAnchor="middle"
        fill="var(--muted)"
        fontSize="11"
        fontFamily="inherit"
      >
        neither side exposed
      </text>

      {/* what each line carries */}
      <text x={178} y={104} textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="inherit">
        money
      </text>
      <text x={178} y={146} textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="inherit">
        account
      </text>
      <text x={382} y={104} textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="inherit">
        payout
      </text>
      <text x={382} y={146} textAnchor="middle" fill="var(--muted)" fontSize="10" fontFamily="inherit">
        login
      </text>
    </svg>
  );
}

/** The same story top to bottom, for screens too narrow to read the wide one. */
function EscrowDiagramStacked({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 400"
      className={className}
      role="img"
      aria-label="The buyer's money and the seller's account are both held by escrow until the trade is proven, then released to the other side."
      fill="none"
    >
      <defs>
        <linearGradient id="esc-stack-in" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="esc-stack-out" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* buyer */}
      <rect
        x={40}
        y={0}
        width={220}
        height={72}
        rx={16}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle cx={74} cy={36} r={16} fill="var(--accent)" fillOpacity="0.14" />
      <circle cx={74} cy={31} r={6} fill="var(--accent)" />
      <path
        d="M62 47c3-4.8 7.2-7.2 12-7.2s9 2.4 12 7.2"
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <text x={104} y={33} fill="var(--foreground)" fontSize="15" fontWeight="600" fontFamily="inherit">
        Buyer
      </text>
      <text x={104} y={51} fill="var(--muted)" fontSize="12" fontFamily="inherit">
        pays in
      </text>

      <path d="M150 72 V116" stroke="url(#esc-stack-in)" strokeWidth="2" strokeLinecap="round" />
      <text x={162} y={98} fill="var(--muted)" fontSize="11" fontFamily="inherit">
        money + account
      </text>

      {/* the vault */}
      <rect
        x={40}
        y={116}
        width={220}
        height={140}
        rx={20}
        fill="var(--surface)"
        stroke="var(--accent)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <rect x={40} y={116} width={220} height={140} rx={20} fill="var(--accent)" fillOpacity="0.05" />
      <g transform="translate(126, 140)">
        <ShieldGlyph />
      </g>
      <text
        x={150}
        y={222}
        textAnchor="middle"
        fill="var(--foreground)"
        fontSize="15"
        fontWeight="600"
        fontFamily="inherit"
      >
        Held in escrow
      </text>
      <text x={150} y={241} textAnchor="middle" fill="var(--muted)" fontSize="12" fontFamily="inherit">
        neither side exposed
      </text>

      <path d="M150 256 V300" stroke="url(#esc-stack-out)" strokeWidth="2" strokeLinecap="round" />
      <text x={162} y={282} fill="var(--muted)" fontSize="11" fontFamily="inherit">
        payout + login
      </text>

      {/* seller */}
      <rect
        x={40}
        y={300}
        width={220}
        height={72}
        rx={16}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle cx={74} cy={336} r={16} fill="var(--accent)" fillOpacity="0.14" />
      <circle cx={74} cy={331} r={6} fill="var(--accent)" />
      <path
        d="M62 347c3-4.8 7.2-7.2 12-7.2s9 2.4 12 7.2"
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <text
        x={104}
        y={333}
        fill="var(--foreground)"
        fontSize="15"
        fontWeight="600"
        fontFamily="inherit"
      >
        Seller
      </text>
      <text x={104} y={351} fill="var(--muted)" fontSize="12" fontFamily="inherit">
        paid out
      </text>
    </svg>
  );
}

function PartyNode({ x, y, label, sub }: { x: number; y: number; label: string; sub: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={136}
        height={112}
        rx={18}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle cx={68} cy={44} r={15} fill="var(--accent)" fillOpacity="0.14" />
      <circle cx={68} cy={39} r={5.5} fill="var(--accent)" />
      <path
        d="M57 54c2.6-4.4 6.6-6.6 11-6.6s8.4 2.2 11 6.6"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <text
        x={68}
        y={82}
        textAnchor="middle"
        fill="var(--foreground)"
        fontSize="13"
        fontWeight="600"
        fontFamily="inherit"
      >
        {label}
      </text>
      <text x={68} y={98} textAnchor="middle" fill="var(--muted)" fontSize="11" fontFamily="inherit">
        {sub}
      </text>
    </g>
  );
}

/** The shield-and-keyhole from the logo, redrawn at diagram scale. */
function ShieldGlyph() {
  return (
    <g>
      <path
        d="M24 2 44 9v16c0 12.4-8 21.6-20 25.6C12 46.6 4 37.4 4 25V9L24 2Z"
        fill="var(--accent)"
        fillOpacity="0.16"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx={24} cy={22} r={5} fill="var(--accent)" />
      <path d="M24 26v8" stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Feature icons
// ---------------------------------------------------------------------------

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LockIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className} aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 018 0v3.5" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function VaultIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="10.5" cy="12" r="3.5" />
      <path d="M10.5 8.5v-2M10.5 17.5v-2M7 12H5M16 12h3M18 9v6" />
    </svg>
  );
}

export function ScalesIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className} aria-hidden="true">
      <path d="M12 4v16M7 20h10M12 6.5l6.5 1.5M12 6.5L5.5 8" />
      <path d="M5.5 8L3 14a2.6 2.6 0 005 0L5.5 8zM18.5 8L16 14a2.6 2.6 0 005 0L18.5 8z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Decoration
// ---------------------------------------------------------------------------

/**
 * Texture behind a section: a brand-coloured wash plus faint graph paper.
 *
 * Absolutely positioned and pointer-events-none, so it never intercepts a
 * click and never affects layout. The parent needs `relative`.
 */
export function SectionTexture({ variant = "grid" }: { variant?: "grid" | "dots" }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 glow-hero" />
      <div className={`absolute inset-0 ${variant === "dots" ? "texture-dots" : "texture-grid"}`} />
    </div>
  );
}

/**
 * A frame for artwork.
 *
 * Pass `src` to use a real image; with none it draws a placeholder so the
 * layout is complete either way. The frame owns the aspect ratio and the
 * rounding, so dropping art in later cannot break the grid.
 */
export function ArtFrame({
  src,
  alt,
  caption,
  children,
  className = "",
}: {
  src?: string;
  alt?: string;
  caption?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] ${className}`}
    >
      <div className="relative aspect-[16/10] w-full">
        {src ? (
          // Plain <img>: the art is decorative and may come from anywhere,
          // including a path this project does not control at build time.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center p-6">{children ?? <ArtPlaceholder />}</div>
        )}
      </div>
      {caption ? (
        <figcaption className="border-t border-[var(--border)] px-4 py-2.5 text-xs text-[var(--muted)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Drawn stand-in: an account card being handed over, lock still on it. */
function ArtPlaceholder() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" fill="none" aria-hidden="true">
      <rect
        x="30"
        y="24"
        width="112"
        height="72"
        rx="10"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <rect x="30" y="24" width="112" height="20" rx="10" fill="var(--accent)" fillOpacity="0.12" />
      <rect x="42" y="56" width="52" height="6" rx="3" fill="var(--border)" />
      <rect x="42" y="70" width="34" height="6" rx="3" fill="var(--border)" />
      <g transform="translate(112, 54)">
        <rect
          x="0"
          y="7"
          width="22"
          height="16"
          rx="4"
          fill="var(--accent)"
          fillOpacity="0.18"
          stroke="var(--accent)"
          strokeWidth="1.6"
        />
        <path d="M5 7V4a6 6 0 0112 0v3" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <path
        d="M150 60h24"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 5"
      />
    </svg>
  );
}
