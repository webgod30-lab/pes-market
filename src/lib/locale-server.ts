import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/locale";

/**
 * The visitor's chosen language, or English.
 *
 * Split from lib/locale.ts because that module is imported by the language
 * menu, which is a client component — and next/headers cannot cross that
 * boundary. Everything here is server-only.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;

  return isLocale(chosen) ? chosen : DEFAULT_LOCALE;
}
