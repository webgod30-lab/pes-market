import Link from "next/link";

import { CONFIRMATION_WINDOW_HOURS } from "@/lib/escrow-flow";
import { defaultFeeBps, formatFeeBps } from "@/lib/fees";

/**
 * Every question the site answers, in one place.
 *
 * The landing page shows a handful and /faq shows all of them. Keeping two
 * lists would mean the short one slowly stops matching the long one, and the
 * answers here are about money and disputes — the two subjects where saying
 * two different things is worst.
 *
 * Answers are JSX because several of them link out, and the fee answer changes
 * shape entirely depending on whether a fee is configured. `featured` marks the
 * ones that earn a place on the landing page: the objections someone raises
 * before they trust the service, not the ones they look up afterwards.
 */
export type Faq = {
  q: string;
  a: React.ReactNode;
  /** Shown on the landing page as well as /faq. */
  featured?: boolean;
};

export type FaqGroup = { group: string; items: Faq[] };

export function faqGroups(): FaqGroup[] {
  const feeBps = defaultFeeBps();
  const feeLabel = formatFeeBps(feeBps);
  const feeOn = feeBps > 0;

  return [
    {
      group: "The basics",
      items: [
        {
          q: "Do you sell accounts?",
          featured: true,
          a: (
            <>
              No. There is nothing to browse here. You and the other person agree a deal somewhere
              else, and this service holds both halves of it until the trade is proven — the account
              on one side, the money on the other.
            </>
          ),
        },
        {
          q: "What does it cost?",
          featured: true,
          a: feeOn ? (
            <>
              {feeLabel} of the deal, taken out of the seller&apos;s payout. The buyer pays exactly the
              agreed price. You see the exact split on the deal before committing, and it is locked in
              when the deal is opened.
            </>
          ) : (
            <>Nothing at the moment — the seller receives exactly what the buyer paid.</>
          ),
        },
        {
          q: "Who goes first?",
          featured: true,
          a: (
            <>
              The seller deposits the account first, but into escrow — the buyer cannot see it. Then
              the buyer pays, also into escrow. Neither side is ever exposed to the other.
            </>
          ),
        },
      ],
    },
    {
      group: "Money",
      items: [
        {
          q: "When does the seller actually get paid?",
          featured: true,
          a: (
            <>
              After the buyer confirms they have claimed the account. Not when payment arrives, not
              when the credentials are released — only after the buyer has the account and says so.
            </>
          ),
        },
        {
          q: "What if the buyer just never confirms?",
          a: (
            <>
              They have {CONFIRMATION_WINDOW_HOURS} hours. After that the deal is flagged and the
              admin chases them. If they stay silent, the admin decides it from the record rather than
              leaving the seller unpaid forever.
            </>
          ),
        },
        {
          q: "I paid the wrong amount.",
          a: (
            <>
              An underpayment is never settled automatically — it is held and flagged for the admin.
              Message on the deal and it gets sorted out there.
            </>
          ),
        },
        {
          q: "Can I get a refund?",
          a: (
            <>
              Before you pay, either side can cancel and nothing has happened. After you pay, it is a
              dispute: the admin refunds the buyer or pays the seller, depending on what the record
              shows.
            </>
          ),
        },
      ],
    },
    {
      group: "Safety",
      items: [
        {
          q: "The seller took the account back after I claimed it.",
          featured: true,
          a: (
            <>
              This is exactly what the confirmation window is for. Open a dispute from the deal page —
              it freezes everything, including the payout, and the admin decides. Change the email and
              password the moment you get the account, and keep screenshots.
            </>
          ),
        },
        {
          q: "Konami is asking for a verification code I never received.",
          featured: true,
          a: (
            <>
              It went to the seller. Changing the email sends the code to the address still on the
              account, which is theirs until the transfer completes. Ask for it on the deal page —
              there is a button for it during the claim — and it appears there once they paste it in.
              Your money stays held the whole time.
            </>
          ),
        },
        {
          q: "I am the seller. Why am I still getting emails from Konami?",
          a: (
            <>
              Because the account is still registered to you until the buyer finishes the transfer.
              You need to pass those codes on through the deal page. You are not paid until the buyer
              confirms, and they cannot confirm without them — so going quiet here only delays your
              own payout.
            </>
          ),
        },
        {
          q: "The seller has gone silent and I am stuck on a code.",
          a: (
            <>
              Open a dispute. It freezes everything, and the admin can see exactly when you asked and
              that nobody answered. Your money has not gone anywhere.
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
          q: "Can I trade outside the site to save the fee?",
          a: (
            <>
              You can, and people get robbed doing it every day. If it did not happen on a deal here,
              there is no record, no held funds and nothing the admin can do for you.
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
              . Both sides review each other, so a buyer who never pays is as visible as a bad seller.
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
