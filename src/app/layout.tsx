import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui";
import { themeBootScript } from "@/components/theme-toggle";
import { SITE } from "@/lib/site";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Blocking, and deliberately before anything paints: a visitor who
            chose light must not see a dark frame first. suppressHydrationWarning
            above is because this script edits <html> before React sees it. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />

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
