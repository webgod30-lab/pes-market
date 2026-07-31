import Link from "next/link";

import { getCurrentUserQuietly } from "@/lib/dal";
import { defaultFeeBps, formatFeeBps } from "@/lib/fees";
import { getTrustStats } from "@/lib/reviews";
import { ButtonLink, Card } from "@/components/ui";

/** The escrow flow, in the order it actually happens. */
const FLOW = [
  {
    actor: "Both of you",
    title: "Agree the deal first",
    detail:
      "Account and price are settled between you two, wherever you already talk. This site does not sell anything.",
  },
  {
    actor: "Either of you",
    title: "Open the deal here",
    detail: "Whoever goes first records the account and the agreed price, then sends an invite code.",
  },
  {
    actor: "Seller",
    title: "Deposits the account",
    detail: "Login details are encrypted the moment they are submitted. The buyer cannot see them yet.",
  },
  {
    actor: "Buyer",
    title: "Pays into escrow",
    detail: "The admin confirms the payment and holds it. Nothing reaches the seller yet.",
  },
  {
    actor: "Admin",
    title: "Verifies, then releases",
    detail: "The account is checked against what was promised before any credentials are handed over.",
  },
  {
    actor: "Buyer",
    title: "Claims and confirms",
    detail: "Buyer changes the email and password, then confirms. Only then is the seller paid.",
  },
];

export default async function HomePage() {
  // The landing page must work with no database at all — it is the one page a
  // brand-new install can always show, so both lookups tolerate failure.
  const user = await getCurrentUserQuietly();
  const feeBps = defaultFeeBps();

  const stats = await getTrustStats().catch(() => null);

  return (
    <div className="space-y-14">
      <section className="text-center">
        <p className="mb-3 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Trusted third party for account trades
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          You two agreed the deal. We make sure nobody gets robbed.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">
          Not a shop — there is nothing to browse here. Bring a deal you have already agreed on. The
          seller&apos;s account details are held encrypted, the buyer&apos;s money is held in escrow,
          and neither moves until the trade actually works.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {user ? (
            <ButtonLink href={user.role === "admin" ? "/admin" : "/dashboard"}>
              Go to your deals
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/register">Start a deal</ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                I have an invite code
              </ButtonLink>
            </>
          )}
        </div>

        <p className="mt-4 text-sm text-[var(--muted)]">
          <Link href="/how-it-works" className="text-emerald-400 hover:underline">
            See exactly how a trade works
          </Link>{" "}
          before you commit to anything.
        </p>
      </section>

      {/* Social proof, but only once there is something real to show. Zeroes
          would say more about the service than nothing does. */}
      {stats && stats.completedDeals > 0 ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <Card className="text-center">
            <p className="text-2xl font-semibold text-amber-300">
              {stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : "—"}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              from {stats.reviews} review{stats.reviews === 1 ? "" : "s"}
            </p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-semibold">{stats.completedDeals}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">deals completed</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-semibold">
              {stats.cleanRate === null ? "—" : `${Math.round(stats.cleanRate * 100)}%`}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">settled without a dispute</p>
          </Card>
        </section>
      ) : null}

      <section>
        <h2 className="mb-5 text-center text-lg font-semibold">How a trade works</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-emerald-950">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    {step.actor}
                  </span>
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{step.detail}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold">The seller is not exposed</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
            Account details are encrypted with AES-256-GCM on submission, and only released to the
            buyer once the admin approves delivery.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold">The buyer is not exposed</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
            Money is held until the account is verified and actually claimed. If it does not work,
            one button freezes the deal for the admin to arbitrate.
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold">
            {feeBps > 0 ? `${formatFeeBps(feeBps)} fee` : "No fee"}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
            {feeBps > 0
              ? "Taken from the seller's payout, shown on the deal before anyone commits. The buyer pays exactly the agreed price."
              : "The seller receives exactly what the buyer paid."}
          </p>
        </Card>
      </section>
    </div>
  );
}
