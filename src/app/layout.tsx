import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { themeBootScript } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  // Without this, the social preview image resolves against localhost and the
  // card breaks everywhere the link is shared. AUTH_URL is the deployed origin.
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: "PES Escrow — trusted third party for account trades",
  description:
    "Already agreed a price for an eFootball / PES account? Trade it safely: the account is held encrypted, the money is held in escrow, and neither moves until the trade works.",
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
      </head>
      {/* overflow-x-hidden is a safety net: a single wide element (a long wallet
          address, a pasted transaction hash) should never make the whole page
          scroll sideways on a phone. */}
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
