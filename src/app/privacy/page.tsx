import Link from "next/link";

import { SITE, legalDetailsAreConfigured } from "@/lib/site";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/deals";
import { LastUpdated, Notice, Points, Prose, Section } from "@/components/prose";
import { PageHeading } from "@/components/ui";

export const metadata = {
  title: "Privacy policy — PES Escrow",
  description:
    "What data this escrow service collects, how account credentials are protected, what is public, and how long things are kept.",
};

export default function PrivacyPage() {
  const configured = legalDetailsAreConfigured();

  return (
    <Prose>
      <PageHeading title="Privacy policy" />
      <LastUpdated date={SITE.legalLastUpdated} />

      {!configured ? (
        <div className="mt-6">
          <Notice>
            <strong>This is a template, not legal advice.</strong> It accurately describes what the
            software does with data, which is the part most policies get wrong — but it needs review
            against the privacy law that applies to you (GDPR, UK GDPR, CCPA and others differ). Fill
            in the operator details in <code className="font-mono text-xs">src/lib/site.ts</code>;
            naming who controls the data is a legal requirement in most places.
          </Notice>
        </div>
      ) : null}

      <Section title="Who controls your data">
        <p>
          {SITE.operator}, operating {SITE.name} from {SITE.jurisdiction}. Contact us at{" "}
          <span className="font-mono text-xs">{SITE.supportEmail}</span> about anything on this page.
        </p>
      </Section>

      <Section title="What we collect">
        <Points
          items={[
            <>
              <strong className="text-[var(--foreground)]">Your account:</strong> email address,
              display name, and a hashed password. We never store your password itself — only a bcrypt
              hash, which cannot be reversed back into it.
            </>,
            <>
              <strong className="text-[var(--foreground)]">Deals:</strong> what was traded, the agreed
              price, who the parties are, timestamps, and every state change.
            </>,
            <>
              <strong className="text-[var(--foreground)]">Game account credentials:</strong> the
              login the seller deposits, encrypted (see below).
            </>,
            <>
              <strong className="text-[var(--foreground)]">Payment references:</strong> the
              transaction hash or reference you give us so we can match a payment. We do not collect
              or store card numbers — no card details ever pass through this service.
            </>,
            <>
              <strong className="text-[var(--foreground)]">Messages and reviews</strong> you write on
              deals.
            </>,
          ]}
        />
      </Section>

      <Section title="How account credentials are protected">
        <p>
          Credentials deposited for a deal are encrypted with AES-256-GCM before they are written to
          the database, using a key held outside it. They are decrypted in exactly two situations: for
          the administrator to verify the account works before releasing it, and for the buyer after
          that release is approved.
        </p>
        <p>
          They are never included in a page unless specifically requested by someone entitled to see
          them, never written to logs, and never sent to any third party. Database query logging is
          deliberately disabled so credentials cannot leak into log files.
        </p>
      </Section>

      <Section title="What is public">
        <p>
          Reviews are public, along with the display names of the people involved and the rating. This
          is the point of them: it is how someone decides whether to trade with a stranger.
        </p>
        <p>
          Public pages never include email addresses, deal references, what was traded, or amounts.
          Choose a display name you are comfortable being seen — you are not required to use your real
          name.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>
          We do not sell your data and we do not use it for advertising. It is shared only with the
          services needed to run this one: our database host, and — if you use an automatic payment
          method — the payment provider, which receives the amount and a deal reference. We share
          data with law enforcement only where legally required.
        </p>
        <p>The other party to your deal sees your display name, your messages, and your reviews.</p>
      </Section>

      <Section title="How long we keep it">
        <Points
          items={[
            "Deal records are kept while the deal is open and afterwards as a record of the transaction, including for resolving later disputes.",
            `Credentials are kept for the deal they belong to. Once a deal is complete and the ${CONFIRMATION_WINDOW_HOURS}-hour window has passed, you should have changed them anyway — change the email and password on any account you buy, immediately.`,
            "Messages and reviews are kept as part of the deal record.",
            "If you close your account, we remove your personal details but keep the minimum needed to show that past deals happened and were settled.",
          ]}
        />
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, you may have the right to see the data we hold about you,
          correct it, ask us to delete it, or object to how we use it. Ask us and we will do it,
          subject to keeping what we genuinely need for deals that have happened and for legal
          obligations.
        </p>
        <p>
          One thing we cannot do is delete a review purely because it is unflattering. Removing bad
          reviews on request would make every good review worthless.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          One cookie, holding your sign-in session, so you stay signed in between pages. There is no
          analytics, no tracking and no advertising cookie on this site. Signing out clears it.
        </p>
      </Section>

      <Section title="Security, honestly stated">
        <p>
          Passwords are hashed, credentials are encrypted, and every action that moves money or
          releases an account is checked against who you are on the server rather than trusted from
          the browser. No system is perfect. If you find a problem, please{" "}
          <Link href="/contact" className="text-[var(--accent)] hover:underline">
            tell us
          </Link>{" "}
          rather than exploiting it — we would rather hear it from you.
        </p>
      </Section>
    </Prose>
  );
}
