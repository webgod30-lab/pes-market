import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUserQuietly } from "@/lib/dal";
import {
  FIRST_PAYOUT_CENTS,
  FOUNDING_PLACES,
  FOUNDING_RATE_DAYS,
  FOUNDING_REWARD_CENTS,
  foundingPlacesLeft,
  MINIMUM_PAYOUT_CENTS,
  REFERRAL_REWARD_CENTS,
} from "@/lib/referrals";
import { formatCents } from "@/lib/money";
import { SITE } from "@/lib/site";
import { PromoterApplyForm } from "@/components/promoter-apply-form";
import { PublisherWarning } from "@/components/publisher-warning";
import { Card, PageHeading } from "@/components/ui";
import { Prose, Section } from "@/components/prose";

export const metadata = {
  title: "Become a promoter",
  description:
    "Your code is the door — nobody registers on PESescrow.com without one. Earn $2 every time someone who used yours completes a swap. No code needed to apply.",
};

/**
 * The public way in.
 *
 * Everywhere else on this site needs a promoter's code, which makes it closed:
 * the only people who can join are people who already know a member. That works
 * for traders, who arrive in pairs having already agreed a swap, and not at all
 * for somebody who wants to advertise the service and knows nobody.
 *
 * So this page takes no code. It is the only one that does not.
 *
 * The order is deliberate: what you earn comes before what you cannot do. An
 * earlier version led with the restriction, and the people best placed to
 * promote this — traders with reputations — read "cannot open or join a swap"
 * as "not for me" and left.
 */
export default async function PromotePage() {
  // Quietly: this page must render with a broken database so the form can
  // report the real reason on submit.
  const user = await getCurrentUserQuietly();

  // Anyone signed in already has a code — send them to it rather than letting
  // them apply for something they have.
  if (user) redirect(user.role === "admin" ? "/admin/promoters" : "/referrals");

  // Tolerates failure for the same reason: a page that cannot render is worse
  // than one missing a number.
  const placesLeft = await foundingPlacesLeft().catch(() => 0);

  return (
    <Prose>
      <PageHeading
        title="Become a promoter"
        description="Your code is the door. Nobody registers here without one."
      />

      <p className="text-base leading-relaxed">
        There is no open sign-up on this site. Every single person who trades here got in through
        somebody&apos;s code. If it is yours, you earn{" "}
        <strong className="text-[var(--foreground)]">{formatCents(REFERRAL_REWARD_CENTS)}</strong>{" "}
        every time they complete a swap.
      </p>

      <p className="mt-3 text-base leading-relaxed">
        You do not need a code to apply for this. This page is the way in if you do not know anyone
        yet.
      </p>

      {/* The network's track record, said before the mechanics.
          Attributed to the network rather than to this site, deliberately: the
          platform is new and its own numbers are small, so a promoter who read
          "200 promoters" and then saw a handful of deals here would conclude
          the figure was invented. Saying where it comes from is what keeps a
          true claim believable. */}
      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <p className="text-overline uppercase text-[var(--muted)]">
          We were doing this before the site existed
        </p>

        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--muted)]">Promoters across the network</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
              {SITE.network.promoters}+
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--muted)]">Paid out to them monthly</dt>
            <dd className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
              ${(SITE.network.monthlyPayoutUsd / 1000).toFixed(0)}k+
            </dd>
          </div>
        </dl>

        <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs leading-relaxed text-[var(--muted)]">
          Those are the people already promoting this and what they are paid every month. The
          escrow you see here is the new part — we built it so the swaps we were already refereeing
          by hand run on something, and so the code you share leads somewhere.
        </p>
      </div>

      {placesLeft > 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] p-4">
          <p className="text-overline uppercase text-[var(--tone-success)]">Founding promoters</p>
          <p className="mt-1.5 text-sm leading-relaxed">
            <strong className="text-[var(--foreground)]">
              {formatCents(FOUNDING_REWARD_CENTS)} per swap for your first {FOUNDING_RATE_DAYS} days.
            </strong>{" "}
            The first {FOUNDING_PLACES} approved promoters get the higher rate — we are keeping the
            number small while the platform is young, so a code is worth something.{" "}
            <strong className="text-[var(--foreground)]">
              {placesLeft} of {FOUNDING_PLACES} remaining.
            </strong>
          </p>
        </div>
      ) : null}

      <Section title="How it works">
        <ol className="space-y-2">
          <li>
            <strong className="text-[var(--foreground)]">Apply below.</strong> Tell us where you
            would share it and roughly how many people you reach. We read every application — this
            is the part we actually judge.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Get your code and auto-fill link.</strong>{" "}
            Anyone using it registers instantly, no typing.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Earn on every swap they complete.
            </strong>{" "}
            Forever, not just their first.
          </li>
        </ol>
      </Section>

      <Section title="What you earn">
        {/* Scrolls on its own rather than pushing the page sideways on a phone. */}
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[22rem] border-collapse text-sm">
            <tbody>
              <Row
                label="Every completed swap by someone who used your code"
                value={formatCents(REFERRAL_REWARD_CENTS)}
              />
              <Row
                label={
                  <>
                    A swap where <strong className="text-[var(--foreground)]">both</strong> sides
                    used your code
                  </>
                }
                value={formatCents(REFERRAL_REWARD_CENTS * 2)}
              />
              <Row label="First payout at" value={formatCents(FIRST_PAYOUT_CENTS)} />
              <Row label="After that, payouts at" value={formatCents(MINIMUM_PAYOUT_CENTS)} />
              <Row
                label="Paid"
                value="1st of each month, one batch"
                note="Request any day once you are over."
              />
            </tbody>
          </table>
        </div>
      </Section>

      {/* Directly under the earnings table, because "how do I actually get the
          money" is the next question and the site previously had no answer to
          it anywhere. In a niche where everyone has been scammed at least once,
          an unanswered payment question is not a gap — it reads as evasion. */}
      <Section title="How you get paid">
        <p>
          You choose your payout method when you apply, and you can change it any time before a
          payout goes out.
        </p>

        <div className="-mx-1 mt-3 overflow-x-auto px-1">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start">
                <th className="py-2 pe-4 text-start font-medium">Method</th>
                <th className="py-2 pe-4 text-start font-medium">Speed</th>
                <th className="py-2 text-start font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              <PayoutRow
                method="USDT (TRC-20)"
                speed="Minutes"
                note="Our default. Lowest fees, works anywhere, no bank needed."
              />
              <PayoutRow
                method="PayPal"
                speed="1–2 days"
                note="Sent in USD. Your own conversion and withdrawal costs are set by PayPal, not us."
              />
              <PayoutRow
                method="Gift card"
                speed="Instant"
                note="Steam, Amazon or Google Play. Useful if you don't have a bank account or you're under 18."
              />
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          <strong className="text-[var(--foreground)]">We cover the sending fee.</strong> What it
          costs you to convert or withdraw on your side is between you and your provider — worth
          checking before you pick.
        </p>

        <p>
          <strong className="text-[var(--foreground)]">All balances are in US dollars.</strong> A{" "}
          {formatCents(MINIMUM_PAYOUT_CENTS)} payout is {formatCents(MINIMUM_PAYOUT_CENTS)} sent,
          not {formatCents(MINIMUM_PAYOUT_CENTS)} after we have taken something out.
        </p>

        <p>
          <strong className="text-[var(--foreground)]">
            Your first payout gets a test transaction.
          </strong>{" "}
          We send $1 first and wait for you to confirm it landed, then send the rest. Wallet
          addresses cannot be undone if they are wrong, and we would rather lose a day than lose
          your money.
        </p>

        <p>
          <strong className="text-[var(--foreground)]">Every payment gets a receipt</strong> — a
          transaction hash or reference, recorded against the payout. Keep them. If we ever disagree
          about whether something was paid, that record settles it.
        </p>
      </Section>

      <Section title="You can promote and still trade">
        <p>
          This is the question everyone asks, so: <strong>yes, you can do both.</strong>
        </p>
        <p>
          A promoter account collects earnings and cannot open swaps itself — that is an
          anti-farming rule, not a punishment. If you want to trade as well, register a separate
          normal account using someone else&apos;s code. Promoting does not cost you your trading.
        </p>
        {/* The one thing the audit's copy left out, and it matters: the terms
            ban extra accounts used to multiply credits, and a trading account
            registered under your OWN code is exactly that. Saying so here is
            cheaper than reversing the credits later. */}
        <p>
          One rule on that: do not use{" "}
          <strong className="text-[var(--foreground)]">your own</strong> code on your trading
          account. Referring yourself is farming, and it gets the credits reversed and both accounts
          suspended. Use somebody else&apos;s — that is what everyone here did.
        </p>
      </Section>

      <Section title="This works best if you">
        <ul className="space-y-1.5">
          <li>Run a Discord server, Telegram group or Facebook group where people trade accounts</li>
          <li>Sell accounts with real feedback behind you and lose deals to &ldquo;you go first&rdquo;</li>
          <li>Already middleman for your community — get paid for what you are doing free</li>
          <li>Make eFootball content and get trade requests in your comments</li>
        </ul>
      </Section>

      <Section title="What gets you removed">
        <p>
          Opening deals just to generate credits. Both sides get reversed and the account is
          suspended. We are paying for real trades between real people; that is the whole point.
        </p>
      </Section>

      <Section title="Before you promote it, know this">
        <PublisherWarning />
        <p className="mt-3">
          Say that to your community and you will be the one who told them the truth. It is also the
          answer to the first hard question anyone will ask you.
        </p>
      </Section>

      <Section title="Apply">
        <p>
          Every application is read by hand. The thing that decides it is the last question: where
          you would actually promote this, and to roughly how many people.
        </p>
      </Section>

      <Card elevation="raised">
        <PromoterApplyForm />
      </Card>

      <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
        Already have a code from someone?{" "}
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          Register normally
        </Link>{" "}
        — you get a promoter code of your own either way, and a normal account can trade too.
      </p>
    </Prose>
  );
}

function PayoutRow({
  method,
  speed,
  note,
}: {
  method: string;
  speed: string;
  note: string;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0 align-top">
      <td className="py-2.5 pe-4 font-semibold whitespace-nowrap">{method}</td>
      <td className="py-2.5 pe-4 whitespace-nowrap text-[var(--muted)]">{speed}</td>
      <td className="py-2.5 leading-relaxed text-[var(--muted)]">{note}</td>
    </tr>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: React.ReactNode;
  value: string;
  note?: string;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="py-2.5 pe-4 align-top leading-relaxed text-[var(--muted)]">
        {label}
        {note ? <span className="mt-0.5 block text-xs">{note}</span> : null}
      </td>
      <td className="py-2.5 text-end align-top font-semibold tabular-nums whitespace-nowrap">
        {value}
      </td>
    </tr>
  );
}
