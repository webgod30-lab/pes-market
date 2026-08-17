import Link from "next/link";

import { SITE, legalDetailsAreConfigured } from "@/lib/site";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/deals";
import { LastUpdated, Notice, Points, Prose, Section } from "@/components/prose";
import { PageHeading } from "@/components/ui";

export const metadata = {
  title: "Terms of service",
  description: "The rules for using this escrow service, and the limits of what it covers.",
};

export default function TermsPage() {
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
            your jurisdiction to review it before you run this with real users. Fill in the operator details in{" "}
            <code className="font-mono text-xs">src/lib/site.ts</code> first; they are referenced
            throughout this page.
          </Notice>
        </div>
      ) : null}

      <Section title="1. What this service is">
        <p>
          {SITE.name} is an escrow service operated by {SITE.operator}. It holds both accounts in a
          swap until each has been checked, acting as a neutral third party between two people who
          have already agreed to trade elsewhere.
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
          We charge nothing. Trades on this service are account-for-account, so there is no price to
          take a percentage of, and we never ask either party for payment. If that ever changes, it
          will apply only to deals created after the change.
        </p>
      </Section>

      <Section title="5. Accounts held and released">
        <Points
          items={[
            "Both parties deposit their account credentials, which we hold encrypted and release only after we have checked both accounts.",
            "We release each side's credentials to the other after both have been verified, or after a dispute is decided.",
            `Each party has ${CONFIRMATION_WINDOW_HOURS} hours from the release of credentials to confirm or raise a dispute.`,
            "No money passes between the parties on this service, and we hold no funds on anyone's behalf.",
            "Anything agreed or exchanged outside a deal on this service is not covered by anything on this page.",
          ]}
        />
      </Section>

      <Section title="5a. Referral programme">
        <Points
          items={[
            "An account can only be created using a valid promoter code issued by an existing account.",
            "Every account receives a promoter code of its own on registration.",
            "We credit a promoter $2 each time a person who registered with their code completes a deal. Both parties to a completed deal credit their own promoter separately.",
            "A promoter earns nothing from a deal they were themselves a party to.",
            "Credits are payable once a promoter's balance reaches $40. Requests may be made on any day and are paid in one batch on the 1st of each month.",
            "Credits for a deal are withdrawn if that deal is later reversed. If the promoter has already been paid, the amount is recovered from later credits before any further payout.",
            "We may refuse or reverse credits we believe were generated by deals arranged solely to obtain them, and may suspend an account that does so.",
          ]}
        />
      </Section>

      <Section title="5b. Payment of credits">
        <p>
          Credits are payable in US dollars once the balance reaches the applicable minimum. The
          promoter selects a payout method from those offered at the time of payment, currently
          USDT (TRC-20), PayPal, or a gift card of the promoter&apos;s choice from the available
          list. We meet the cost of sending; any conversion, withdrawal, or receiving cost charged
          by the promoter&apos;s own provider is the promoter&apos;s responsibility.
        </p>
        <p>
          The promoter is responsible for the accuracy of the payment details they supply. Payments
          sent to an address or account provided by the promoter are treated as delivered, and
          cryptocurrency transfers cannot be reversed. On a first payout we send a nominal test
          amount for confirmation before releasing the balance.
        </p>
        <p>
          We may change the available payout methods, and will give notice before a change affects a
          pending balance. A promoter is responsible for any tax due in their own country on amounts
          received.
        </p>
      </Section>

      <Section title="6. Disputes">
        <p>
          Either party may open a dispute on a deal once accounts have been deposited. This freezes
          the deal entirely. We decide from the record available to us: the two account descriptions
          agreed at the start, our own verification of both accounts, and the messages on the deal.
        </p>
        <p>
          Our decision on whether to release or return the credentials we hold is final as regards
          those credentials. It is not a legal judgment and does not affect any other rights you may
          have against the other party.
        </p>
      </Section>

      <Section title="7. What is not allowed">
        <Points
          items={[
            "Trading accounts you do not own, or that were obtained by fraud, phishing or account theft.",
            "Recovering, reclaiming or interfering with an account after depositing it for a deal.",
            "Opening deals whose purpose is to generate referral credits rather than to trade an account.",
            "Creating additional accounts to obtain or multiply referral credits.",
            "Using the service for any transaction that is illegal where you are.",
            "Abuse, threats or harassment of the other party or of us.",
          ]}
        />
        <p>
          We may suspend or ban an account for any of the above. Where a banned user has deals in
          progress, we will still resolve those deals fairly rather than keeping either account.
        </p>
      </Section>

      <Section title="8. Limits of our responsibility">
        <p>
          We provide this service carefully but without warranty. We hold no money for you, so there
          is no sum we can return: to the extent the law allows, our responsibility for a deal is
          limited to handling the credentials you place with us according to the process described
          here. We are not responsible for publisher action against an account, for the condition or
          value of an account traded through us, for losses on deals conducted outside this service,
          or for indirect losses.
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
