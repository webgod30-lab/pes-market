import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUserQuietly } from "@/lib/dal";
import { MINIMUM_PAYOUT_CENTS, REFERRAL_REWARD_CENTS } from "@/lib/referrals";
import { formatCents } from "@/lib/money";
import { PromoterApplyForm } from "@/components/promoter-apply-form";
import { Card, PageHeading } from "@/components/ui";
import { Prose, Section } from "@/components/prose";

export const metadata = {
  title: "Become a promoter",
  description:
    "Earn $2 every time someone you introduced completes an account swap on PESescrow.com. No code needed to apply — this is the way in if you do not know anyone here yet.",
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
 */
export default async function PromotePage() {
  // Quietly: this page must render with a broken database so the form can
  // report the real reason on submit.
  const user = await getCurrentUserQuietly();

  // Anyone signed in already has a code — send them to it rather than letting
  // them apply for something they have.
  if (user) redirect(user.role === "admin" ? "/admin/promoters" : "/referrals");

  return (
    <Prose>
      <PageHeading
        title="Become a promoter"
        description={`Earn ${formatCents(REFERRAL_REWARD_CENTS)} every time somebody you brought here completes a swap. You do not need a code to apply — this page is the way in if you do not know anyone yet.`}
      />

      <Section title="What you get">
        <ul className="space-y-2">
          <li>
            A promoter code of your own, and a link that fills it in automatically. Nobody can
            register on this site without a code from somebody, so yours is how people get in.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              {formatCents(REFERRAL_REWARD_CENTS)} per completed swap
            </strong>{" "}
            by anyone who used your code. Both people in a swap earn for their own promoter, so a
            trade between two people you introduced pays you twice.
          </li>
          <li>
            Paid out once you reach{" "}
            <strong className="text-[var(--foreground)]">{formatCents(MINIMUM_PAYOUT_CENTS)}</strong>
            , in one batch on the 1st of each month. You can request it on any day once you are over
            the minimum.
          </li>
        </ul>
      </Section>

      <Section title="What it is not">
        <p>
          A promoter account cannot open or join a swap. You were let in to bring people to the
          service, not to trade on it, and the site enforces that rather than just hiding the
          buttons. If you want to trade as well, ask somebody for their code and{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            register normally
          </Link>{" "}
          instead — a normal account can do both.
        </p>
        <p>
          You also earn nothing from a deal you were part of yourself, and deals opened only to
          generate credits get reversed. The programme pays for bringing people here, not for using
          the site.
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
