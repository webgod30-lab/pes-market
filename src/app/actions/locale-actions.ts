"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isLocale, LOCALE_COOKIE } from "@/lib/locale";

/**
 * Remember the visitor's language.
 *
 * A year, and `sameSite: lax` so it survives arriving from a deal invite link
 * in WhatsApp. Not httpOnly — there is nothing sensitive in "this person reads
 * Arabic", and leaving it readable means client code can check it without a
 * round trip.
 *
 * revalidatePath("/", "layout") rather than a redirect: the language lives in
 * the layout, so every cached segment has to be rebuilt, and the visitor should
 * stay on the page they were reading.
 */
export async function setLocaleAction(next: string): Promise<void> {
  if (!isLocale(next)) return;

  const store = await cookies();

  store.set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
