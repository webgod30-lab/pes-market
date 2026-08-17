import Link from "next/link";

import { getCurrentUserQuietly } from "@/lib/dal";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/escrow-flow";
import { CopyBlock } from "@/components/copy-block";
import { PublisherWarning } from "@/components/publisher-warning";
import { Card, PageHeading } from "@/components/ui";
import { Prose, Section } from "@/components/prose";

export const metadata = {
  title: "The 60-second explainer",
  description:
    "Everything you need to explain PESescrow.com in one minute — a paste-anywhere summary and a 60-second video script, with your own referral code already in them.",
};

export const dynamic = "force-dynamic";

/**
 * The promoter kit.
 *
 * A promoter's effort should be pasting, not writing. Every one of them
 * otherwise ends up explaining the service in their own words, which means the
 * service gets explained badly and differently in twenty places — and the
 * places it gets explained wrong are the safety caveats, which are the ones
 * that matter.
 *
 * Signed in, the code below is theirs. Signed out it shows a placeholder, so
 * the page still works as something to link to.
 */
export default async function ExplainerPage() {
  const user = await getCurrentUserQuietly();

  const code = user
    ? await (async () => {
        const { prisma } = await import("@/lib/prisma");
        const row = await prisma.user
          .findUnique({ where: { id: user.id }, select: { referralCode: true } })
          .catch(() => null);

        return row?.referralCode ?? "YOUR-CODE";
      })()
    : "YOUR-CODE";

  const paste = `How PESescrow works — 60 seconds

It's a referee for account-for-account swaps. Free, and no money is involved at any point.

1. You and the other trader agree the swap wherever you normally talk.
2. One of you opens the deal and describes both accounts. You get a code to send them.
3. You both deposit your login details. They're encrypted — the other person can't see yours.
4. An admin logs into both and checks each account is actually what was promised. This is the bit that stops the lying.
5. You each get your Konami codes and submit them.
6. You both change the email and password, and confirm within ${CONFIRMATION_WINDOW_HOURS} hours.

Neither of you goes first. That's the entire idea. Nobody is exposed while the other decides whether to behave.

Registration is invite-only. Code: ${code}
Sign up: https://pesescrow.com/register?ref=${code}

One honest note: this protects you from the other trader, not from Konami. Publishers can suspend traded accounts and no service can stop that.`;

  const script = `[0:00] "You want to swap accounts with someone. Neither of you wants to go first. That's the whole problem, so here's how this fixes it."

[0:08] "You agree the swap wherever you normally talk — Discord, WhatsApp, wherever."

[0:14] [screen: opening a deal] "One of you opens a deal and describes both accounts. You get a code, you send it over."

[0:24] [screen: deposit] "You both deposit your logins. Encrypted. They can't see yours, you can't see theirs."

[0:34] "An admin logs into both accounts and checks they're actually what was promised. This is the step that matters — it's where lies get caught, before anyone's exposed."

[0:46] [screen: codes] "Konami codes get exchanged, you both change the email and password, you confirm within ${CONFIRMATION_WINDOW_HOURS} hours. Done."

[0:54] "It's free. There's no money in it anywhere. It's invite-only, so you need a code — it's in the description."

[1:00] "And to be straight with you: this protects you from the other trader. It doesn't protect you from Konami. Nothing does."`;

  return (
    <Prose>
      <PageHeading
        title="The 60-second explainer"
        description="Everything you need to explain this service in one minute. Copy it, paste it, done — you should never have to write this yourself."
      />

      {user ? (
        <p className="text-sm text-[var(--muted)]">
          Your code is already in both of these. Anyone opening the link gets it filled in for them.
        </p>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>{" "}
          and your own code appears in both of these automatically. Otherwise, replace{" "}
          <code className="font-mono text-xs">YOUR-CODE</code> with yours.
        </p>
      )}

      <Section title="Paste anywhere">
        <p>
          For a Discord pin, a group description, a forum reply, a DM to someone who asked how to
          swap safely.
        </p>
        <CopyBlock text={paste} label="Copy the explainer" className="mt-3" />
      </Section>

      <Section title="Video script — 60 seconds">
        <p>
          A screen recording, no face needed. It ends on the caveat deliberately: that is the line
          people screenshot, and being the one who said it is worth more than the thirty seconds
          before it.
        </p>
        <CopyBlock text={script} label="Copy the script" className="mt-3" />
      </Section>

      <Section title="The question you will get asked">
        <p>
          Sooner or later somebody replies &ldquo;what if Konami bans the account?&rdquo;. Do not
          soften it. This is the answer, and it is the same one printed on the site:
        </p>
      </Section>

      <PublisherWarning />

      <Card className="mt-6">
        <h2 className="text-sm font-semibold">What not to say</h2>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-[var(--muted)]">
          <li>
            Not &ldquo;100% safe&rdquo; or &ldquo;guaranteed&rdquo;. It is not, and the people you
            are talking to know it is not.
          </li>
          <li>
            Not that we hold money. We do not hold any, and the product pages say so — a promoter
            promising otherwise is the fastest way to look like a scam.
          </li>
          <li>
            Do not promise how fast an admin will verify. Say it is checked by a person, because it
            is.
          </li>
        </ul>
      </Card>

      <p className="mt-6 text-xs text-[var(--muted)]">
        <Link href="/referrals" className="text-[var(--accent)] hover:underline">
          Your code and earnings
        </Link>{" "}
        ·{" "}
        <Link href="/promote" className="text-[var(--accent)] hover:underline">
          How the programme pays
        </Link>
      </p>
    </Prose>
  );
}
