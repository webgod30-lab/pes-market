/**
 * Which language the site is in.
 *
 * Deliberately free of next/headers: the language menu is a client component
 * and needs LOCALES and LOCALE_NAME. Reading the cookie lives in
 * lib/locale-server.ts, which only the server imports.
 *
 * A cookie rather than a URL prefix. Routing stays exactly as it is — no
 * /ar/deals/... duplicate of every page, no middleware rewrites, and every link
 * already written across the app keeps working. The trade is that a page cannot
 * be shared "in Arabic" by its URL, which for a service people reach through a
 * deal invite rather than search is a fair price.
 */
export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "pes-locale";

/** Right-to-left languages. Drives `dir` on <html>. */
export function directionOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** What each language calls itself. Never translated — endonyms never are. */
export const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};
