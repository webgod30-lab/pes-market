// The sections of the signed-in area, written once.
//
// The admin console navigated through a horizontal strip of six links defined
// in components/admin-nav.tsx, and the trader dashboard had no navigation of
// its own at all — you got back to your wallet through the site header or not
// at all. Both now read from here.
//
// Plain data with no JSX, so a server component, a client component or a test
// can all import it. Every href already existed.
import type { NavIconName } from "@/components/nav/nav-icons";
import type { Role } from "@/generated/prisma/client";

export type DashSection = {
  href: string;
  label: string;
  icon: NavIconName;
  /** Matched against the pathname to light the active row. */
  key: string;
  /** Shown as a count pill. Zero renders nothing rather than a "0". */
  badge?: number;
};

export type DashGroup = { label: string; items: DashSection[] };

/** The trader's own area. */
export function traderSections(counts: {
  open?: number;
  waiting?: number;
  unread?: number;
}): DashGroup[] {
  return [
    {
      label: "Your deals",
      items: [
        { key: "dashboard", href: "/dashboard", label: "Overview", icon: "grid", badge: counts.waiting },
        { key: "notifications", href: "/notifications", label: "Notifications", icon: "inbox" },
        { key: "deals-new", href: "/deals/new", label: "Open a swap", icon: "plus" },
        { key: "deals-join", href: "/deals/join", label: "Join with a code", icon: "ticket" },
        { key: "deals", href: "/deals", label: "Trade history", icon: "folder" },
      ],
    },
    {
      // Renamed from "Money" because a trader has none here: swaps are free and
      // nobody is paid for one. The only money in this section is what someone
      // earns for bringing other people in, so the section says that.
      label: "Promote & earn",
      items: [
        { key: "referrals", href: "/referrals", label: "Your code", icon: "ticket" },
        { key: "wallet", href: "/wallet", label: "Your balance", icon: "wallet" },
      ],
    },
    {
      label: "Account",
      items: [{ key: "security", href: "/settings/security", label: "Security", icon: "shield" }],
    },
  ];
}

/**
 * The admin console.
 *
 * Badges are the whole point of this sidebar: an admin opens the console to
 * find out what is waiting, and putting the counts next to the sections means
 * that question is answered before they click anything.
 */
export function adminSections(counts: {
  deals?: number;
  withdrawals?: number;
  disputes?: number;
}): DashGroup[] {
  return [
    {
      label: "Console",
      items: [
        { key: "hub", href: "/admin", label: "Overview", icon: "gauge" },
        { key: "deals", href: "/admin/deals", label: "Deals", icon: "folder", badge: counts.deals },
      ],
    },
    {
      label: "Queues",
      items: [
        {
          key: "withdrawals",
          href: "/admin/withdrawals",
          label: "Withdrawals",
          icon: "payout",
          badge: counts.withdrawals,
        },
        {
          key: "disputes",
          href: "/admin/disputes",
          label: "Disputes",
          icon: "scales",
          badge: counts.disputes,
        },
      ],
    },
    {
      label: "Settings",
      items: [
        { key: "users", href: "/admin/users", label: "Users", icon: "users" },
        { key: "payments", href: "/admin/payment-methods", label: "Payment methods", icon: "card" },
      ],
    },
  ];
}

export function sectionsFor(
  role: Role,
  counts: { deals?: number; withdrawals?: number; disputes?: number; waiting?: number },
): DashGroup[] {
  return role === "admin" ? adminSections(counts) : traderSections(counts);
}
