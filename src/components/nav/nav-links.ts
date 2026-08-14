// Where the navigation can go, written once.
//
// The desktop bar, the desktop dropdowns and the mobile sheet all render from
// this one model. They used to keep separate lists — the sheet had "Join with a
// code" and the bar did not, the bar had "Balance" and the sheet called it
// "Your balance" — and that is how a nav ends up describing the same route two
// ways depending on the width of the screen.
//
// Nothing here decides *how* a link looks. It is plain data with no JSX, so it
// can be imported by a server component, a client component, or a test without
// pulling React along.
//
// Every href in this file already existed in the navigation. Reorganising which
// menu a link sits in does not change where it goes.
import type { NavIconName } from "@/components/nav/nav-icons";
import type { MessageKey } from "@/lib/dictionary";
import type { Role } from "@/generated/prisma/client";

export type NavItem = {
  href: string;
  labelKey: MessageKey;
  /** Shown in dropdowns, which have room to say what a link is for. */
  description?: string;
  icon: NavIconName;
};

export type NavGroup = {
  labelKey: MessageKey | null;
  /** Announced on the mobile sheet's section heading. */
  items: NavItem[];
};

/**
 * What the navigation needs to know about whoever is signed in.
 *
 * A narrow slice of CurrentUser rather than the whole record: this crosses into
 * client components, and the id and creation date have no business being
 * serialised into the page for a menu that only shows a name and a role.
 */
export type NavUser = {
  displayName: string;
  email: string;
  role: Role;
};

/** The letter in the avatar. Falls back for a name that is only punctuation. */
export function initialOf(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || "?";
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/**
 * The one public link that stays in the bar at full size.
 *
 * Someone who has just been sent here by a stranger asking them to trade wants
 * exactly one thing: to find out what this is. That question does not belong
 * behind a dropdown.
 */
export const PRIMARY_LINK: NavItem = {
  href: "/how-it-works",
  labelKey: "nav.howItWorks",
  description: "The seven steps, and when the money actually moves",
  icon: "route",
};

export const RESOURCES: NavGroup = {
  labelKey: "nav.resources",
  items: [
    {
      href: "/reviews",
      labelKey: "nav.reviews",
      description: "Every review, from both sides of a completed deal",
      icon: "star",
    },
    {
      href: "/faq",
      labelKey: "nav.faq",
      description: "Payouts, disputes, and the awkward questions",
      icon: "help",
    },
    {
      href: "/contact",
      labelKey: "nav.contact",
      description: "Ask before you send anything",
      icon: "mail",
    },
  ],
};

/** Flat public list, in bar order. */
export const PUBLIC_LINKS: NavItem[] = [PRIMARY_LINK, ...RESOURCES.items];

// ---------------------------------------------------------------------------
// Signed in
// ---------------------------------------------------------------------------

/** Where "your deals" lives, which differs for an admin. */
export function homeHref(role: Role): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

/**
 * The deal actions, as a dropdown in the bar.
 *
 * An admin gets the console rather than the trader's dashboard, and does not
 * get "Open a deal" or a balance — they arbitrate deals rather than trading
 * them. That mirrors the `role === "admin" ? null : ...` branches the old
 * header had scattered through its markup, in one place.
 *
 * They do keep "Join with a code", because nothing in the application stops an
 * admin joining a deal and the previous mobile menu offered it to them. Whether
 * that should be allowed is a product question; quietly removing the only link
 * to it while redesigning the nav is not the way to raise it.
 */
export function dealsGroup(role: Role): NavGroup {
  if (role === "admin") {
    return {
      labelKey: "nav.console",
      items: [
        {
          href: "/admin",
          labelKey: "nav.adminConsole",
          description: "Deals, disputes, withdrawals and users",
          icon: "gauge",
        },
        {
          href: "/deals/join",
          labelKey: "nav.joinCode",
          description: "Someone sent you an invite",
          icon: "ticket",
        },
      ],
    };
  }

  return {
    labelKey: "nav.deals",
    items: [
      {
        href: "/dashboard",
        labelKey: "nav.yourDeals",
        description: "Everything you have open right now",
        icon: "grid",
      },
      {
        href: "/deals/new",
        labelKey: "nav.openDeal",
        description: "Record the terms and get an invite code",
        icon: "plus",
      },
      {
        href: "/deals/join",
        labelKey: "nav.joinCode",
        description: "Someone sent you an invite",
        icon: "ticket",
      },
    ],
  };
}

/**
 * The profile menu's contents, below the identity header.
 *
 * "Your deals" appears here as well as in the Deals dropdown, deliberately: the
 * bar dropdown is gone at narrow widths where the profile menu remains, and a
 * profile menu with no route to your own deals is a dead end.
 */
export function accountLinks(role: Role): NavItem[] {
  const home: NavItem = {
    href: homeHref(role),
    labelKey: role === "admin" ? "nav.adminConsole" : "nav.yourDeals",
    icon: role === "admin" ? "gauge" : "grid",
  };

  const wallet: NavItem[] =
    role === "admin"
      ? []
      : [{ href: "/wallet", labelKey: "nav.balance", icon: "wallet" }];

  return [home, ...wallet, { href: "/settings/security", labelKey: "nav.security", icon: "shield" }];
}

// ---------------------------------------------------------------------------
// The mobile sheet
// ---------------------------------------------------------------------------

/**
 * The whole sheet, as sections.
 *
 * Sections rather than one long list: signed in, this is nine links, and nine
 * undifferentiated rows on a phone is a wall. Signed out it collapses to a
 * single unlabelled section, because four links do not need organising.
 */
export function mobileSections(role: Role | null): NavGroup[] {
  if (role === null) {
    return [{ labelKey: null, items: PUBLIC_LINKS }];
  }

  const deals = dealsGroup(role);

  return [
    deals,
    { labelKey: "nav.learn", items: PUBLIC_LINKS },
    {
      labelKey: "nav.account",
      // The deals group already offers the home link; repeating it inside
      // Account would put the same row on screen twice, one above the other.
      items: accountLinks(role).filter(
        (item) => !deals.items.some((existing) => existing.href === item.href),
      ),
    },
  ];
}
