import type { Metadata } from "next";
import { Chakra_Petch } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui";
import { SITE } from "@/lib/site";
import { directionOf } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import "./globals.css";

/**
 * The one webfont on the site, and only the wordmark uses it.
 *
 * Body text stays on the system stack — no fetch, no layout shift, instant
 * first paint — which is worth keeping. But the logo is Chakra Petch and a
 * near-enough substitute is not the same logo, so this loads a single weight
 * and nothing else. `display: swap` means a slow network delays the brand for a
 * moment rather than blocking the page behind it.
 */
const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-chakra",
});

export const metadata: Metadata = {
  // Without this, the social preview image resolves against localhost and the
  // card breaks everywhere the link is shared. AUTH_URL is the deployed origin.
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: {
    // Every page gives only its own title and this appends the brand. It used
    // to be written out by hand in 24 files, which is 24 places to miss when
    // the name changes — and the name just changed.
    template: `%s — ${SITE.name}`,
    default: `${SITE.name} — trusted third party for account trades`,
  },
  description:
    "Already agreed a price for an eFootball / PES account? Trade it safely: the account is held encrypted, the money is held in escrow, and neither moves until the trade works.",
  applicationName: SITE.name,
  openGraph: {
    siteName: SITE.name,
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read on the server, so the first byte already carries the right direction.
  // Setting dir in the browser would flip the whole layout after first paint.
  const locale = await getLocale();

  // No suppressHydrationWarning any more: nothing edits <html> before React
  // sees it now that the theme is fixed. The blocking boot script that used to
  // read the stored choice went with it.
  return (
    <html
      lang={locale}
      dir={directionOf(locale)}
      className={`h-full antialiased ${display.variable}`}
    >
      <head>
        {/* Scroll-reveal animations ship their starting state in the HTML, so
            the landing page arrives with ~26 elements at opacity 0 and only
            JavaScript turns them on. With scripting off that is a blank page
            below the hero — the worst possible first impression for a service
            asking to be trusted with money. This hands those people the final
            state directly. */}
        <noscript>
          <style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      {/* overflow-x-hidden is a safety net: a single wide element (a long wallet
          address, a pasted transaction hash) should never make the whole page
          scroll sideways on a phone. */}
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
        <SiteFooter />

        {/* One live region for the whole app, mounted here rather than created
            when the first message arrives — a live region added at the same
            moment as its content is often not announced at all. */}
        <Toaster />

        {/* Page counts and load timings only: no cookies, no cross-site
            identifier, nothing tied to a person. That is why this site has no
            consent banner — there is nothing to consent to. Anything that
            tracked individuals would need one, and would need the privacy
            policy rewritten. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
