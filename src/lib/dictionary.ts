import type { Locale } from "@/lib/locale";

/**
 * The site's chrome, in both languages.
 *
 * Deliberately scoped to the shell — navigation, buttons, the footer, the words
 * that appear on every page. Long-form pages (the terms, the FAQ, how-it-works)
 * are still English, and translating those is a writing job rather than a
 * plumbing one: they carry the legal and safety wording, and a half-accurate
 * Arabic version of "escrow protects you from the other person, not from the
 * publisher" is worse than an English one a reader can look up.
 *
 * Flat keys, not nested objects. A nested tree reads nicely and then someone
 * adds `nav.deals.label` next to `nav.deals` and TypeScript cannot tell you the
 * shapes diverged. A flat record typed against the English keys means Arabic
 * cannot be missing one.
 */
const en = {
  // --- navigation ---
  "nav.main": "Main",
  "nav.howItWorks": "How it works",
  "nav.resources": "Resources",
  "nav.reviews": "Reviews",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",
  "nav.deals": "Deals",
  "nav.console": "Console",
  "nav.yourDeals": "Your deals",
  "nav.openDeal": "Open a deal",
  "nav.joinCode": "Join with a code",
  "nav.adminConsole": "Admin console",
  "nav.tradeHistory": "Trade history",
  "nav.notifications": "Notifications",
  "nav.balance": "Your balance",
  "nav.security": "Security",
  "nav.overview": "Overview",
  "nav.learn": "Learn",
  "nav.account": "Account",
  "nav.money": "Money",
  "nav.queues": "Queues",
  "nav.settings": "Settings",

  // --- account ---
  "account.signIn": "Sign in",
  "account.signOut": "Sign out",
  "account.startDeal": "Start a deal",
  "account.menu": "Account menu",

  // --- language ---
  "lang.label": "Language",
  "lang.change": "Change language",

  // --- footer ---
  "footer.service": "Service",
  "footer.help": "Help",
  "footer.legal": "Legal",
  "footer.terms": "Terms of service",
  "footer.privacy": "Privacy policy",
  "footer.createAccount": "Create an account",

  // --- menus ---
  "menu.open": "Open menu",
  "menu.close": "Close menu",
  "menu.site": "Site menu",
} as const;

export type MessageKey = keyof typeof en;

/**
 * Arabic. Modern Standard, not Darija — it reads correctly to any Arabic
 * speaker, where Darija would only serve Morocco and looks wrong written down
 * to everyone else.
 */
const ar: Record<MessageKey, string> = {
  "nav.main": "الرئيسية",
  "nav.howItWorks": "كيف تعمل الخدمة",
  "nav.resources": "موارد",
  "nav.reviews": "التقييمات",
  "nav.faq": "الأسئلة الشائعة",
  "nav.contact": "اتصل بنا",
  "nav.deals": "الصفقات",
  "nav.console": "لوحة التحكم",
  "nav.yourDeals": "صفقاتك",
  "nav.openDeal": "افتح صفقة",
  "nav.joinCode": "انضم برمز الدعوة",
  "nav.adminConsole": "لوحة الإدارة",
  "nav.tradeHistory": "سجل الصفقات",
  "nav.notifications": "الإشعارات",
  "nav.balance": "رصيدك",
  "nav.security": "الأمان",
  "nav.overview": "نظرة عامة",
  "nav.learn": "تعرّف على الخدمة",
  "nav.account": "الحساب",
  "nav.money": "المال",
  "nav.queues": "قوائم الانتظار",
  "nav.settings": "الإعدادات",

  "account.signIn": "تسجيل الدخول",
  "account.signOut": "تسجيل الخروج",
  "account.startDeal": "ابدأ صفقة",
  "account.menu": "قائمة الحساب",

  "lang.label": "اللغة",
  "lang.change": "تغيير اللغة",

  "footer.service": "الخدمة",
  "footer.help": "المساعدة",
  "footer.legal": "قانوني",
  "footer.terms": "شروط الخدمة",
  "footer.privacy": "سياسة الخصوصية",
  "footer.createAccount": "إنشاء حساب",

  "menu.open": "افتح القائمة",
  "menu.close": "أغلق القائمة",
  "menu.site": "قائمة الموقع",
};

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { en, ar };

/** A lookup bound to one language. Pass it down rather than re-reading cookies. */
export type Translate = (key: MessageKey) => string;

export function translator(locale: Locale): Translate {
  const dictionary = DICTIONARIES[locale];

  // Falls back to English rather than rendering the key. A missing string
  // should look like an untranslated site, not like a broken one.
  return (key) => dictionary[key] ?? en[key];
}
