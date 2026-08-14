import Link from "next/link";

import { CONFIRMATION_WINDOW_HOURS } from "@/lib/escrow-flow";
import { FAQ_AR, FAQ_GROUPS_AR } from "@/lib/faq-ar";
import type { Locale } from "@/lib/locale";

/**
 * Every question the site answers, in one place.
 *
 * The landing page shows a handful and /faq shows all of them. Keeping two
 * lists would mean the short one slowly stops matching the long one, and the
 * answers here are about payouts and disputes — the two subjects where saying
 * two different things is worst.
 *
 * Answers are JSX because several of them link out. `featured` marks the ones
 * that earn a place on the landing page: the objections someone raises before
 * they trust the service, not the ones they look up afterwards.
 */
export type Faq = {
  q: string;
  a: React.ReactNode;
  /** Shown on the landing page as well as /faq. */
  featured?: boolean;
};

export type FaqGroup = { group: string; items: Faq[] };

export function faqGroups(): FaqGroup[] {
  return [
    {
      group: "The basics",
      items: [
        {
          q: "Do you sell accounts?",
          featured: true,
          a: (
            <>
              No. There is nothing to browse here. You and the other person agree a swap somewhere
              else, and this service holds both accounts until each one has been checked.
            </>
          ),
        },
        {
          q: "What does it cost?",
          featured: true,
          a: (
            <>
              Nothing. You trade an account for an account — there is no price, so there is nothing
              to take a percentage of, and we never ask either side for money.
            </>
          ),
        },
        {
          q: "Can I sell an account for money instead?",
          featured: true,
          a: (
            <>
              Not here, not any more. Every deal on this site is account-for-account. Deals closed
              under the old cash flow are still in your history, but nothing new can be opened that
              way.
            </>
          ),
        },
        {
          q: "Who goes first?",
          featured: true,
          a: (
            <>
              Neither of you, in the way that matters. You both deposit into escrow, where the other
              person cannot see anything, and both logins are released together only after the admin
              has checked both accounts.
            </>
          ),
        },
        {
          q: "Why do I need a code to sign up?",
          featured: true,
          a: (
            <>
              Because everyone here arrived through somebody, and that is what the promoter programme
              pays for. Ask whoever invited you for their code — it looks like{" "}
              <span className="font-mono">PES-7F3K9Q</span> — and paste it into the sign-up form. You
              get a code of your own the moment you register.
            </>
          ),
        },
      ],
    },
    {
      group: "Promoting and getting paid",
      items: [
        {
          q: "How much do I earn?",
          featured: true,
          a: (
            <>
              $2 every time someone who signed up with your code completes a swap. Both people in a
              swap earn for their own promoter, so if you introduced both of them, that one deal pays
              you twice.
            </>
          ),
        },
        {
          q: "When do I get the money?",
          featured: true,
          a: (
            <>
              Payouts go out in one batch on the 1st of each month, once your balance is at least
              $40. You can request one on any day — it does not have to be the 1st — and it is sent
              on the next one.
            </>
          ),
        },
        {
          q: "Why $40 and not less?",
          a: (
            <>
              Every payout is a transfer sent by hand, and it costs a fee. At $2 a time the fee would
              eat most of what you earned. $40 is twenty completed deals.
            </>
          ),
        },
        {
          q: "Where do I find my code?",
          a: (
            <>
              On{" "}
              <Link href="/referrals" className="text-[var(--accent)] hover:underline">
                your promoter page
              </Link>
              , with a link you can paste straight into a chat. Anyone opening that link gets the
              code filled in for them.
            </>
          ),
        },
        {
          q: "Can I just swap accounts with a friend over and over to farm it?",
          a: (
            <>
              No. A promoter earns nothing from a deal they were in themselves, earnings that all
              come from one person are flagged before any payout is sent, and deals opened only to
              generate credits are grounds for having them reversed and the account suspended.
            </>
          ),
        },
        {
          q: "What if the deal I earned from gets reversed?",
          a: (
            <>
              The credit goes with it. If you had already been paid, the balance goes negative and
              later credits clear it before anything else is paid out.
            </>
          ),
        },
        {
          q: "What if the other person never confirms?",
          a: (
            <>
              They have {CONFIRMATION_WINDOW_HOURS} hours. After that the deal is flagged and the
              admin chases them. If they stay silent, the admin decides it from the record rather
              than leaving the deal open forever.
            </>
          ),
        },
        {
          q: "Can I cancel a swap?",
          a: (
            <>
              Before either account is deposited, yes — either side can cancel and nothing has
              happened. After that it is a dispute, and the admin decides from the record.
            </>
          ),
        },
      ],
    },
    {
      group: "Safety",
      items: [
        {
          q: "The other person took their account back after I claimed it.",
          featured: true,
          a: (
            <>
              This is exactly what the confirmation window is for. Open a dispute from the deal page —
              it freezes everything and the admin decides. Change the email and password the moment
              you get the account, and keep screenshots.
            </>
          ),
        },
        {
          q: "Konami is asking for a verification code I never received.",
          featured: true,
          a: (
            <>
              It went to the other person. Changing the email sends the code to the address still on
              the account, which is theirs until the transfer completes. Ask for it on the deal page
              — there is a button for it during the claim — and it appears there once they paste it
              in. Nothing else moves in the meantime.
            </>
          ),
        },
        {
          q: "Why am I still getting emails from Konami about the account I deposited?",
          a: (
            <>
              Because it is still registered to you until the other side finishes the transfer. You
              need to pass those codes on through the deal page. The swap does not close until both
              of you confirm, and they cannot confirm without them — so going quiet only delays your
              own account arriving.
            </>
          ),
        },
        {
          q: "The other side has gone silent and I am stuck on a code.",
          a: (
            <>
              Open a dispute. It freezes everything, and the admin can see exactly when you asked and
              that nobody answered. Your own account has not gone anywhere.
            </>
          ),
        },
        {
          q: "Who can see the account login?",
          featured: true,
          a: (
            <>
              It is encrypted before it is stored. The admin decrypts it once, to check the account
              works before releasing it. The buyer sees it only after that check. Nobody else, at any
              point.
            </>
          ),
        },
        {
          q: "Why bother using the site at all if it is free?",
          a: (
            <>
              Because swapping directly means one of you hands over an account first, and that person
              can be robbed. Here neither login is visible to the other side until the admin has
              checked both. Trade outside it and there is no record and nothing the admin can do for
              you.
            </>
          ),
        },
        {
          q: "How do I know the person I am dealing with is real?",
          a: (
            <>
              Check their record before you join — the invite shows their rating, and{" "}
              <Link href="/reviews" className="text-[var(--accent)] hover:underline">
                every review is public
              </Link>
              . Both sides review each other, so someone who hands over a dead account is visible
              either way.
              &ldquo;No reviews yet&rdquo; is not a red flag on its own, but it does mean there is
              nothing to go on.
            </>
          ),
        },
      ],
    },
    {
      group: "The awkward questions",
      items: [
        {
          q: "Is selling a game account even allowed?",
          featured: true,
          a: (
            <>
              Most publishers, including Konami, prohibit selling or transferring accounts in their
              terms of service. A publisher can suspend a traded account, and this service cannot stop
              that or reverse it. Escrow protects you from the other person — it does not protect you
              from the publisher. Understand that before you trade.
            </>
          ),
        },
        {
          q: "What happens if the account gets banned later?",
          a: (
            <>
              Once a deal has completed and the payout is sent, it is closed. If a ban happens quickly
              and the payout has not gone out yet, raise it immediately — the admin can still reverse
              it at that point.
            </>
          ),
        },
      ],
    },
  ];
}

/** The subset worth putting in front of someone who has not decided yet. */
export function featuredFaqs(): Faq[] {
  return faqGroups().flatMap((group) => group.items.filter((item) => item.featured));
}

/**
 * The same questions, in the requested language.
 *
 * An overlay rather than a second tree: faqGroups() stays the single source of
 * which questions exist and in what order, and Arabic is applied on top by
 * matching the English question. Anything without a translation falls through
 * to English, so adding a question to the list above can never blank this page.
 */
export function faqGroupsFor(locale: Locale): FaqGroup[] {
  const groups = faqGroups();

  if (locale !== "ar") return groups;

  return groups.map((group) => ({
    group: FAQ_GROUPS_AR[group.group] ?? group.group,
    items: group.items.map((item) => {
      const translated = FAQ_AR[item.q];

      return translated ? { ...item, q: translated.q, a: translated.a } : item;
    }),
  }));
}

/** The featured subset, in the requested language. */
export function featuredFaqsFor(locale: Locale): Faq[] {
  return faqGroupsFor(locale).flatMap((group) => group.items.filter((item) => item.featured));
}
