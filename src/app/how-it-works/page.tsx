import Link from "next/link";

import { defaultFeeBps, formatFeeBps } from "@/lib/fees";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/deals";
import { Prose, Section, Points } from "@/components/prose";
import { ButtonLink, Card, PageHeading } from "@/components/ui";

export const metadata = {
  title: "How it works — PES Escrow",
  description:
    "How an escrowed game account trade works, step by step: what each side does, what the admin checks, and when the money actually moves.",
};

const STEPS = [
  {
    n: 1,
    who: "Both of you",
    title: "Agree the deal first",
    body: "Account, price, what is included. That happens wherever you already talk — Discord, WhatsApp, a forum. Nothing is sold on this site.",
  },
  {
    n: 2,
    who: "Either of you",
    title: "Open the deal and send the code",
    body: "Whoever goes first records the account and the agreed price, and gets a single-use invite code. The other person opens it, sees exactly those terms, and joins.",
  },
  {
    n: 3,
    who: "Seller",
    title: "Deposit the account",
    body: "The login goes in encrypted. The buyer cannot see any of it. You can still correct a typo right up until the buyer pays — after that it is frozen.",
  },
  {
    n: 4,
    who: "Buyer",
    title: "Pay into escrow",
    body: "The money goes to the admin, not the seller. Until it is confirmed, nothing has happened and nobody is out of pocket.",
  },
  {
    n: 5,
    who: "Admin",
    title: "Verify, then release",
    body: "The admin logs into the account and checks it matches what was promised, records what they found, and only then hands the login to the buyer.",
  },
  {
    n: 6,
    who: "Seller",
    title: "Pass on the Konami code",
    body: "Changing the email makes Konami send a verification code to the address still on the account — yours. The buyer asks for it on the deal page, you paste it in. You are not paid until they are through this.",
  },
  {
    n: 7,
    who: "Buyer",
    title: "Claim it, then confirm",
    body: `Change the email and password, check the account is really yours, then confirm. You have ${CONFIRMATION_WINDOW_HOURS} hours. The seller is paid only after you confirm.`,
  },
];

export default function HowItWorksPage() {
  const feeBps = defaultFeeBps();

  return (
    <Prose>
      <PageHeading
        title="How it works"
        description="Both sides are exposed in a normal account trade: whoever goes first can be robbed. Escrow removes that by holding each half until the other is proven."
      />

      <ol className="space-y-3">
        {STEPS.map((step) => (
          <li key={step.n}>
            <Card>
              <div className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-bold text-emerald-950">
                  {step.n}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    {step.who}
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold">{step.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{step.body}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Section title="What it costs">
        <p>
          {feeBps > 0 ? (
            <>
              The escrow fee is <strong className="text-[var(--foreground)]">{formatFeeBps(feeBps)}</strong>,
              taken out of the seller&apos;s payout. The buyer pays exactly the agreed price — never
              more. The exact split is shown on the deal before either side commits, and it is locked
              in when the deal is opened, so changing the rate later cannot alter a deal already in
              progress.
            </>
          ) : (
            <>There is currently no escrow fee. The seller receives exactly what the buyer paid.</>
          )}
        </p>
      </Section>

      <Section title="If something goes wrong">
        <p>
          Either side can open a dispute from the deal page once money is involved. That freezes
          everything immediately — no credentials, no payout — and opens a case for the admin, who
          decides from the record: the frozen payment details, the verification note, and the whole
          conversation on the deal.
        </p>
        <p>
          Before any money moves, there is no dispute to have: either party can simply cancel and walk
          away.
        </p>
      </Section>

      <Section title="Rules that protect you">
        <Points
          items={[
            "Never send account details or money outside a deal. If it is not on this site, the admin cannot help you and there is no record.",
            "Check the terms on the invite before you join. If the price or the account is not what you agreed, do not join.",
            "Buyers: change the email and password the moment you get the account, then confirm. The confirmation window exists for you, not against you.",
            "Sellers: do not touch the account after depositing it. Recovering an account you have sold is the fastest way to lose a dispute.",
            "Sellers: stay reachable until the buyer confirms. Konami sends the transfer code to your inbox, and the buyer cannot finish without it — going quiet at that point is what turns a normal deal into a dispute.",
          ]}
        />
      </Section>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/register">Start a deal</ButtonLink>
        <ButtonLink href="/faq" variant="secondary">
          Read the FAQ
        </ButtonLink>
      </div>

      <p className="mt-6 text-xs text-[var(--muted)]">
        Still unsure?{" "}
        <Link href="/contact" className="text-[var(--accent)] hover:underline">
          Get in touch
        </Link>{" "}
        before you send anything.
      </p>
    </Prose>
  );
}
