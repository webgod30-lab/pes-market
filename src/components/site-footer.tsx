import Link from "next/link";

import { LogoLink } from "@/components/logo";
import { SITE } from "@/lib/site";

const COLUMNS = [
  {
    heading: "Service",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/reviews", label: "Reviews" },
      { href: "/deals/new", label: "Open a deal" },
      { href: "/deals/join", label: "Join with a code" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create an account" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[var(--surface)]/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <LogoLink size={28} />
            <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
              {SITE.tagline}. We hold the account and the money until both sides are proven — so
              whoever goes first is not the one taking the risk.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]">
                {column.heading}
              </h2>
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
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The honest bit. Saying this plainly is worth more than a trust badge. */}
        <div className="mt-10 space-y-3 border-t border-[var(--border)] pt-6 text-xs leading-relaxed text-[var(--muted)]">
          <p>
            <strong className="text-[var(--foreground)]">We do not sell accounts.</strong> Nothing is
            listed or advertised here. Buyers and sellers agree their own deals elsewhere and use this
            service to complete them safely.
          </p>
          <p>
            Game publishers generally prohibit selling or transferring accounts, and can suspend a
            traded account. Escrow protects you from the other person in the trade — not from the
            publisher. See the{" "}
            <Link href="/terms" className="text-[var(--accent)] hover:underline">
              terms
            </Link>{" "}
            before you trade.
          </p>
          <p>
            Not affiliated with, endorsed by, or connected to Konami, eFootball, PES, or any game
            publisher.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)]">
          <p>
            © {year} {SITE.name}
          </p>
          {/* min-h-9 for the same reason as the columns above: as bare inline
              text these sat at 16px, and here they are side by side, so a
              near-miss lands on the neighbour rather than on nothing. */}
          <div className="-my-1 flex flex-wrap gap-x-5">
            <Link href="/terms" className="inline-flex min-h-9 items-center hover:text-[var(--foreground)]">
              Terms
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-9 items-center hover:text-[var(--foreground)]"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-9 items-center hover:text-[var(--foreground)]"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
