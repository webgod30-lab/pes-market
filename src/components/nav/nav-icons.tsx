// Icons for the navigation, by name.
//
// A lookup rather than direct imports, because nav-links.ts is plain data with
// no JSX in it — it names an icon and the rendering side resolves it here. That
// keeps the link model importable from anywhere without dragging components
// along, and means one list drives the desktop dropdowns and the mobile sheet.
//
// Drawn inline for the same reasons as components/graphics.tsx: sharp at any
// size, no extra request, and painted with currentColor so one drawing serves
// both palettes.

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export type NavIconName =
  | "route"
  | "star"
  | "help"
  | "mail"
  | "plus"
  | "ticket"
  | "grid"
  | "wallet"
  | "shield"
  | "gauge"
  // Admin console sections. Here rather than in a second icon file so the
  // sidebar and the site nav cannot end up drawing the same idea two ways.
  | "folder"
  | "scales"
  | "users"
  | "card"
  | "payout"
  | "inbox";

const ICONS: Record<NavIconName, React.ReactNode> = {
  // The seven-step flow: a path with stops on it.
  route: (
    <>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M8.4 6H14a4 4 0 010 8h-4a4 4 0 000 8h5.6" />
    </>
  ),
  star: <path d="M12 3.6l2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.6 2.6 0 015 1c0 1.7-2.5 2-2.5 3.6" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3.8 7l7.2 5.2a1.7 1.7 0 002 0L20.2 7" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.4v7.2M8.4 12h7.2" />
    </>
  ),
  // An invite code: a ticket with a perforation.
  ticket: (
    <>
      <path d="M3 8.5A1.5 1.5 0 014.5 7h15A1.5 1.5 0 0121 8.5v2a2 2 0 000 4v1A1.5 1.5 0 0119.5 17h-15A1.5 1.5 0 013 15.5v-1a2 2 0 000-4z" />
      <path strokeDasharray="1.6 2.4" d="M14 7.6v8.8" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <circle cx="17" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.5V11c0 4.4-2.9 7.7-7 9-4.1-1.3-7-4.6-7-9V5.5L12 3z" />
      <circle cx="12" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 12.6v2.4" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 17a8 8 0 1116 0" />
      <path d="M12 17l4-4.6" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7.5A1.5 1.5 0 014.5 6h4l2 2.5h7A1.5 1.5 0 0119 10v7a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 013 17z" />
    </>
  ),
  // Disputes: a balance, weighing one account of events against the other.
  scales: (
    <>
      <path d="M12 4v16M7 20h10M12 6.5l6.5 1.5M12 6.5L5.5 8" />
      <path d="M5.5 8L3 14a2.6 2.6 0 005 0L5.5 8zM18.5 8L16 14a2.6 2.6 0 005 0L18.5 8z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0111 0" />
      <path d="M16 5.6a3.2 3.2 0 010 5.8M17.5 19a5.5 5.5 0 00-2.2-4.4" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
    </>
  ),
  // Withdrawals: money leaving, on its way out of the service.
  payout: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.8v8.4M8.8 13l3.2 3.2 3.2-3.2" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 12.5h4l1.5 2.5h6l1.5-2.5h4" />
      <path d="M5.2 5.5h13.6l1.7 7v4a2 2 0 01-2 2H5.5a2 2 0 01-2-2v-4z" />
    </>
  ),
};

export function NavIcon({
  name,
  className = "size-[18px]",
}: {
  name: NavIconName;
  className?: string;
}) {
  return (
    <svg {...ICON_PROPS} className={className}>
      {ICONS[name]}
    </svg>
  );
}
