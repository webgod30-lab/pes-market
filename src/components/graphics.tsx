// Original drawn graphics. SERVER-SAFE — no state, no effects.
//
// Everything here is inline SVG rather than image files, for three reasons:
// it stays sharp at any size, it costs no extra network request, and it can
// paint itself with currentColor and the theme variables, so one drawing works
// on both the light and the dark palette.
//
// Nothing in this file depends on a game publisher's artwork.
//
// This used to hold the landing page's escrow diagram, its section textures and
// an artwork frame as well. The landing page was rebuilt as a composition of
// components under components/landing, which draws its own background and
// product shot, and those three had no callers left.

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
