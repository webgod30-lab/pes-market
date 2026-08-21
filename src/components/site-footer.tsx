import Link from "next/link";

import { LogoLink, StatusLine } from "@/components/brand";
import { SITE } from "@/lib/site";
import { translator } from "@/lib/dictionary";
import { getLocale } from "@/lib/locale-server";

type Col = { headingKey: import("@/lib/dictionary").MessageKey; links: { href: string; labelKey: import("@/lib/dictionary").MessageKey }[] };

const COLUMNS: Col[] = [
  {
    headingKey: "footer.service",
    links: [
      { href: "/how-it-works", labelKey: "nav.howItWorks" },
      { href: "/reviews", labelKey: "nav.reviews" },
      { href: "/deals/new", labelKey: "nav.openDeal" },
      { href: "/deals/join", labelKey: "nav.joinCode" },
    ],
  },
  {
    headingKey: "footer.help",
    links: [
      { href: "/faq", labelKey: "nav.faq" },
      { href: "/promote", labelKey: "nav.promote" },
      { href: "/contact", labelKey: "nav.contact" },
      { href: "/login", labelKey: "account.signIn" },
      { href: "/register", labelKey: "footer.createAccount" },
    ],
  },
  {
    headingKey: "footer.legal",
    links: [
      { href: "/terms", labelKey: "footer.terms" },
      { href: "/privacy", labelKey: "footer.privacy" },
    ],
  },
];

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const t = translator(await getLocale());

  return (
    <footer className="relative mt-24 border-t border-[var(--border)] bg-[var(--surface)]/40">
      {/* A hairline of brand colour along the top edge, fading out at both
          ends. The one piece of decoration down here — it stops the footer
          reading as the page having simply run out. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent"
      />

      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <LogoLink />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              {t("footer.brand")}. {t("footer.tagline")}
            </p>

            {/* The status line from the logo system — the third element of the
                lockup, which the 56px header has no room for. Stated once,
                quietly, where it can be checked against the rest of the site
                rather than shouted as a badge. */}
            <p className="mt-5">
              <StatusLine>{t("footer.encrypted")}</StatusLine>
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.headingKey}>
              <h2 className="text-overline uppercase text-[var(--foreground)]">{t(column.headingKey)}</h2>
              {/* space-y-0.5 rather than -2: the padding below now provides
                  the separation, and keeping the old gap as well would push
                  the footer to twice its height on a phone. */}
              <ul className="mt-2 space-y-0.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      // inline-flex + min-h-9: as plain inline text these were
                      // 19px tall, under the 24px minimum and easy to mis-tap
                      // where they stack closely on a phone.
                      className="inline-flex min-h-9 items-center text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The honest bit. Saying this plainly is worth more than a trust badge. */}
        <div className="mt-12 space-y-3 border-t border-[var(--border)] pt-8 text-xs leading-relaxed text-[var(--muted)]">
          <p>
            <strong className="text-[var(--foreground)]">{t("footer.noSaleBold")}</strong>{" "}
            {t("footer.noSaleBody")}
          </p>
          <p>
            {t("footer.publisherLead")}{" "}
            <Link href="/terms" className="text-[var(--accent)] hover:underline">
              {t("footer.publisherLink")}
            </Link>{" "}
            {t("footer.publisherTail")}
          </p>
          <p>
            {t("footer.notAffiliated")}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          <p>
            © {year} {SITE.name}
          </p>
          {/* min-h-9 for the same reason as the columns above: as bare inline
              text these sat at 16px, and here they are side by side, so a
              near-miss lands on the neighbour rather than on nothing. */}
          <div className="-my-1 flex flex-wrap gap-x-5">
            <Link href="/terms" className="inline-flex min-h-9 items-center hover:text-[var(--foreground)]">
              {t("footer.termsShort")}
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-9 items-center hover:text-[var(--foreground)]"
            >
              {t("footer.privacyShort")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-9 items-center hover:text-[var(--foreground)]"
            >
              {t("nav.contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
