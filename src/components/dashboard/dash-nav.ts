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
import type { Locale } from "@/lib/locale";
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


/**
 * The rail labels, in both languages.
 *
 * The admin console is deliberately not translated: it is used by us, and a
 * half-translated console is harder to work in than an English one. Everything
 * a promoter or a trader sees is.
 */
const RAIL = {
  en: {
    yourDeals: "Your deals",
    promoteEarn: "Promote & earn",
    account: "Account",
    overview: "Overview",
    notifications: "Notifications",
    openSwap: "Open a swap",
    joinCode: "Join with a code",
    history: "Trade history",
    yourCode: "Your code",
    yourBalance: "Your balance",
    security: "Security",
  },
  ar: {
    yourDeals: "صفقاتك",
    promoteEarn: "ادعُ واربح",
    account: "الحساب",
    overview: "نظرة عامة",
    notifications: "الإشعارات",
    openSwap: "افتح مبادلة",
    joinCode: "انضم برمز",
    history: "سجل التداول",
    yourCode: "رمزك",
    yourBalance: "رصيدك",
    security: "الأمان",
  },
} satisfies Record<Locale, Record<string, string>>;

/**
 * A promoter's sidebar.
 *
 * They cannot open or join a deal, so every trading row would be a dead end.
 * What is left is the two things they can actually do — share their code and
 * take the money — plus their own account settings.
 */
export function promoterSections(locale: Locale = "en"): DashGroup[] {
  const say = RAIL[locale];

  return [
    {
      label: say.promoteEarn,
      items: [
        { key: "referrals", href: "/referrals", label: say.yourCode, icon: "ticket" },
        { key: "wallet", href: "/wallet", label: say.yourBalance, icon: "wallet" },
      ],
    },
    {
      label: say.account,
      items: [{ key: "security", href: "/settings/security", label: say.security, icon: "shield" }],
    },
  ];
}

export function traderSections(
  counts: { open?: number; waiting?: number; unread?: number },
  locale: Locale = "en",
): DashGroup[] {
  const say = RAIL[locale];

  return [
    {
      label: say.yourDeals,
      items: [
        { key: "dashboard", href: "/dashboard", label: say.overview, icon: "grid", badge: counts.waiting },
        { key: "notifications", href: "/notifications", label: say.notifications, icon: "inbox" },
        { key: "deals-new", href: "/deals/new", label: say.openSwap, icon: "plus" },
        { key: "deals-join", href: "/deals/join", label: say.joinCode, icon: "ticket" },
        { key: "deals", href: "/deals", label: say.history, icon: "folder" },
      ],
    },
    {
      // Renamed from "Money" because a trader has none here: swaps are free and
      // nobody is paid for one. The only money in this section is what someone
      // earns for bringing other people in, so the section says that.
      label: say.promoteEarn,
      items: [
        { key: "referrals", href: "/referrals", label: say.yourCode, icon: "ticket" },
        { key: "wallet", href: "/wallet", label: say.yourBalance, icon: "wallet" },
      ],
    },
    {
      label: say.account,
      items: [{ key: "security", href: "/settings/security", label: say.security, icon: "shield" }],
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
  promoters?: number;
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
        {
          key: "promoters",
          href: "/admin/promoters",
          label: "Promoter applications",
          icon: "inbox",
          badge: counts.promoters,
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
  locale: Locale = "en",
): DashGroup[] {
  if (role === "admin") return adminSections(counts);
  if (role === "promoter") return promoterSections(locale);

  return traderSections(counts, locale);
}
