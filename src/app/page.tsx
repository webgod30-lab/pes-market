import Link from "next/link";
import { headers } from "next/headers";

import { getCurrentUserQuietly } from "@/lib/dal";
import { defaultFeeBps, formatFeeBps } from "@/lib/fees";
import { getTrustStats } from "@/lib/reviews";
import { formatCents } from "@/lib/money";
import {
  getMonthlyVisits,
  looksAutomated,
  recordVisit,
  VISITS_WORTH_SHOWING,
} from "@/lib/visits";
import { CONFIRMATION_WINDOW_HOURS } from "@/lib/deals";
import { ButtonLink, Card } from "@/components/ui";
import {
  ArtFrame,
  EscrowDiagram,
  LockIcon,
  ScalesIcon,
  SectionTexture,
  VaultIcon,
} from "@/components/graphics";

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
    actor: "Seller",
    title: "Passes on the Konami code",
    detail:
      "Konami sends the transfer code to the email still on the account. It is handed over here, on the record.",
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

  // Counted here rather than in the proxy so it is one write per homepage
  // render, not one per asset. Signed-in people are skipped: the admin
  // refreshing their own site should not read as demand for it.
  const userAgent = (await headers()).get("user-agent");

  if (!user && !looksAutomated(userAgent)) {
    await recordVisit();
  }

  const visits = await getMonthlyVisits();
  const showVisits = visits !== null && visits >= VISITS_WORTH_SHOWING;

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative -mt-8 pt-14 pb-4 text-center sm:-mt-10 sm:pt-20">
        <SectionTexture />

        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-[var(--tone-success)]">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          Trusted third party for account trades
        </p>

        <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          You two agreed the deal. We make sure nobody gets robbed.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-[var(--muted)]">
          Not a shop — there is nothing to browse here. Bring a deal you have already agreed on. The
          seller&apos;s account details are held encrypted, the buyer&apos;s money is held in escrow,
          and neither moves until the trade actually works.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
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
          <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">
            See exactly how a trade works
          </Link>{" "}
          before you commit to anything.
        </p>

        {/* The product in one picture, directly under the promise. */}
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-4 ring-hairline backdrop-blur-sm sm:p-6">
          <EscrowDiagram className="h-auto w-full" />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Social proof, but only once there is something real to show.     */}
      {/* Zeroes would say more about the service than nothing does.       */}
      {/* ---------------------------------------------------------------- */}
      {stats && stats.completedDeals > 0 ? (
        <section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              value={String(stats.completedDeals)}
              label={`deal${stats.completedDeals === 1 ? "" : "s"} completed`}
            />
            <Stat
              value={formatCents(stats.protectedCents)}
              label="held in escrow and released safely"
            />
            <Stat
              value={stats.cleanRate === null ? "—" : `${Math.round(stats.cleanRate * 100)}%`}
              label="settled without a dispute"
            />
            <Stat
              value={stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : "—"}
              label={`from ${stats.reviews} review${stats.reviews === 1 ? "" : "s"}`}
              accent
            />
          </div>

          {/* Visits, not visitors — see src/lib/visits.ts for why. Kept as a
              quiet line rather than a fifth card: it is the weakest signal
              here and should not sit at the same size as money released
              safely. Hidden entirely until it is worth showing. */}
          {showVisits ? (
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              {visits!.toLocaleString("en-GB")} visits to this page so far this month.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* The flow                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative">
        <SectionTexture variant="dots" />

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">How a trade works</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">
            Seven steps, and the money only moves on the last one.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full p-5 ring-hairline transition-colors hover:border-emerald-500/40">
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

      {/* ---------------------------------------------------------------- */}
      {/* What it protects, with artwork                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Whoever goes first is the one taking the risk
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            In a normal account trade someone has to move first, and that person can simply be
            robbed. Escrow removes the choice: both halves are handed to a third party, and neither
            is released until the other is proven.
          </p>

          <ul className="mt-6 space-y-3">
            <Point icon={<LockIcon />} title="The account is encrypted on arrival">
              AES-256-GCM the moment it is submitted, released to the buyer only after the admin has
              logged in and checked it matches what was promised.
            </Point>
            <Point icon={<VaultIcon />} title="The money is held, not forwarded">
              It reaches the seller only after the buyer confirms they have the account, with{" "}
              {CONFIRMATION_WINDOW_HOURS} hours to say otherwise.
            </Point>
            <Point icon={<ScalesIcon />} title="Either side can freeze it">
              One button stops the deal dead — no credentials, no payout — and opens a case decided
              from the record, not from whoever shouts loudest.
            </Point>
          </ul>
        </div>

        {/* Pass `src` to use real artwork; the drawn placeholder keeps the
            layout intact until then. */}
        <ArtFrame caption="Your account, held under lock until the money clears." />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Fee                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center ring-hairline sm:p-12">
        <SectionTexture />
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          {feeBps > 0 ? `${formatFeeBps(feeBps)}, and that is the whole price` : "No fee"}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-[var(--muted)]">
          {feeBps > 0
            ? "Taken from the seller's payout and shown on the deal before either side commits. The buyer pays exactly the agreed price — never more. The split is locked in when the deal is opened, so changing the rate later cannot touch a trade already in progress."
            : "The seller receives exactly what the buyer paid."}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href={user ? "/deals/new" : "/register"}>Start a deal</ButtonLink>
          <ButtonLink href="/faq" variant="secondary">
            Read the FAQ
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <Card className="p-5 text-center ring-hairline">
      <p
        className={`text-3xl font-semibold tracking-tight ${accent ? "text-[var(--tone-warning)]" : ""}`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-[var(--muted)]">{label}</p>
    </Card>
  );
}

function Point({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3.5">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-[var(--accent)]">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{children}</p>
      </div>
    </li>
  );
}
