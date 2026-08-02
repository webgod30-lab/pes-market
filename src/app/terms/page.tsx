import Link from "next/link";

import { SITE, legalDetailsAreConfigured } from "@/lib/site";
import { defaultFeeBps, formatFeeBps } from "@/lib/fees";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/deals";
import { LastUpdated, Notice, Points, Prose, Section } from "@/components/prose";
import { PageHeading } from "@/components/ui";

export const metadata = {
  title: "Terms of service — PES Escrow",
  description: "The rules for using this escrow service, and the limits of what it covers.",
};

export default function TermsPage() {
  const feeBps = defaultFeeBps();
  const configured = legalDetailsAreConfigured();

  return (
    <Prose>
      <PageHeading title="Terms of service" />
      <LastUpdated date={SITE.legalLastUpdated} />

      {!configured ? (
        <div className="mt-6">
          <Notice>
            <strong>This is a template, not legal advice.</strong> It is written to describe how this
            service actually behaves, which is the useful half — but it still needs a lawyer who knows
            your jurisdiction to review it before you take real money. Fill in the operator details in{" "}
            <code className="font-mono text-xs">src/lib/site.ts</code> first; they are referenced
            throughout this page.
          </Notice>
        </div>
      ) : null}

      <Section title="1. What this service is">
        <p>
          {SITE.name} is an escrow service operated by {SITE.operator}. It holds one side of a trade
          while the other is proven, acting as a neutral third party between a buyer and a seller who
          have already agreed a deal elsewhere.
        </p>
        <p>
          We do not sell, list, advertise or broker game accounts. We are not party to your agreement
          with the other person; we hold and release what you both place with us according to the
          process described in{" "}
          <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">
            How it works
          </Link>
          .
        </p>
      </Section>

      <Section title="2. Who may use it">
        <Points
          items={[
            "You must be old enough to enter a binding contract where you live.",
            "One account per person. Accounts are personal and may not be shared or sold.",
            "You may not be both sides of the same deal, directly or through another account.",
            "You must give accurate information, including about the account being traded.",
          ]}
        />
      </Section>

      <Section title="3. Account trading carries risks we cannot remove">
        <p>
          Most game publishers, including Konami, prohibit the sale or transfer of accounts under
          their own terms of service. A publisher may suspend, reclaim or ban a traded account at any
          time. We have no relationship with any publisher and no ability to prevent, reverse or
          appeal that.
        </p>
        <p>
          Escrow protects you from the other person in the trade. It does not protect you from the
          publisher, and it does not make account trading permitted by them. You use this service
          understanding that risk, and you accept it.
        </p>
      </Section>

      <Section title="4. Fees">
        <p>
          {feeBps > 0 ? (
            <>
              We charge {formatFeeBps(feeBps)} of the agreed price, deducted from the seller&apos;s
              payout. The buyer pays the agreed price and no more. The exact amounts are shown on the
              deal before either party commits, and are fixed at the moment the deal is created —
              a later change to our rate does not affect a deal already open.
            </>
          ) : (
            <>No fee is currently charged. If that changes, it will apply only to deals created after
              the change.</>
          )}
        </p>
      </Section>

      <Section title="5. How money is held and released">
        <Points
          items={[
            "Funds sent for a deal are held by us and are not the seller's property until released.",
            "We release funds to the seller after the buyer confirms they have taken control of the account, or after a dispute is decided in the seller's favour.",
            `Buyers have ${CONFIRMATION_WINDOW_HOURS} hours from the release of credentials to confirm or raise a dispute.`,
            "We are not a bank, we do not pay interest on held funds, and held funds are not insured or protected by any deposit scheme.",
            "Payments made outside a deal on this service are not held by us and are not covered by anything on this page.",
          ]}
        />
      </Section>

      <Section title="6. Disputes">
        <p>
          Either party may open a dispute on a deal that has money in it. This freezes the deal
          entirely. We decide from the record available to us: the account description agreed at the
          start, the payment details captured at the time, our own verification of the account, and
          the messages on the deal.
        </p>
        <p>
          Our decision on how to release or refund the funds we hold is final as regards those funds.
          It is not a legal judgment and does not affect any other rights you may have against the
          other party.
        </p>
      </Section>

      <Section title="7. What is not allowed">
        <Points
          items={[
            "Trading accounts you do not own, or that were obtained by fraud, phishing or account theft.",
            "Recovering, reclaiming or interfering with an account after depositing it for a deal.",
            "Moving a deal off this service to avoid fees, then asking us to intervene.",
            "Using the service to launder funds, or for any transaction that is illegal where you are.",
            "Abuse, threats or harassment of the other party or of us.",
          ]}
        />
        <p>
          We may suspend or ban an account for any of the above. Where a banned user has deals in
          progress, we will still resolve those deals fairly rather than keeping the funds.
        </p>
      </Section>

      <Section title="8. Limits of our responsibility">
        <p>
          We provide this service carefully but without warranty. To the extent the law allows, our
          total liability to you for any deal is limited to the amount we hold for that deal. We are
          not responsible for publisher action against an account, for losses on deals conducted
          outside this service, or for indirect losses.
        </p>
        <p>Nothing here limits liability that cannot lawfully be limited, including for fraud.</p>
      </Section>

      <Section title="9. Changes and contact">
        <p>
          We may update these terms. Material changes will not be applied retroactively to deals
          already open. These terms are governed by the law of {SITE.jurisdiction}.
        </p>
        <p>
          Questions:{" "}
          <Link href="/contact" className="text-[var(--accent)] hover:underline">
            contact us
          </Link>
          .
        </p>
      </Section>
    </Prose>
  );
}
