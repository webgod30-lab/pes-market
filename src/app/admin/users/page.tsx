import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listUsersForAdmin } from "@/lib/admin";
import { getReputation } from "@/lib/reviews";
import { AdminNav } from "@/components/admin-nav";
import { BanUserForm, UnbanUserForm } from "@/components/user-moderation";
import { ReputationLine } from "@/components/reputation";
import { Badge, Card, EmptyState, PageHeading, SetupProblem, inputClassName } from "@/components/ui";

export const metadata = { title: "Users — admin — PES Escrow" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const auth = await requireUserOrProblem(["admin"], "/admin/users");

  if (auth.problem) return <SetupProblem title={auth.problem.title} fix={auth.problem.fix} />;

  const params = await searchParams;
  const search = params.q ?? "";

  const users = await listUsersForAdmin(search);

  // Reputation per user, so you can see a track record before judging someone.
  const reputations = await Promise.all(users.map((user) => getReputation(user.id)));

  return (
    <div>
      <PageHeading
        title="Users"
        description="Banning takes effect on the person's next request — the session is re-checked against the database, not trusted."
      />

      <AdminNav current="users" />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search name or email"
          className={`${inputClassName} max-w-md flex-1`}
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm hover:bg-[var(--border)]"
        >
          Search
        </button>
        {search ? (
          <Link
            href="/admin/users"
            className="self-center text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {users.length === 0 ? (
        <EmptyState>Nobody matches.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {users.map((user, index) => (
            <li key={user.id}>
              <Card className={user.isBanned ? "border-red-500/30" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{user.displayName}</span>
                      {user.role === "admin" ? <Badge tone="warning">admin</Badge> : null}
                      {user.isBanned ? <Badge tone="danger">banned</Badge> : null}
                      {user.openDeals > 0 ? (
                        <Badge tone="info">
                          {user.openDeals} deal{user.openDeals === 1 ? "" : "s"} in flight
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs text-[var(--muted)]">{user.email}</p>

                    <div className="mt-1">
                      <ReputationLine reputation={reputations[index]} />
                    </div>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      joined {user.createdAt.toLocaleDateString("en-GB")} · sold{" "}
                      {user.dealsAsSeller} · bought {user.dealsAsBuyer}
                    </p>

                    {user.isBanned && user.banReason ? (
                      <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                        Banned {user.bannedAt?.toLocaleDateString("en-GB")}: {user.banReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/deals?filter=all&q=${encodeURIComponent(user.displayName)}`}
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      Their deals
                    </Link>

                    {user.role === "admin" ? (
                      <span className="text-xs text-[var(--muted)]">admins cannot be banned</span>
                    ) : user.isBanned ? (
                      <UnbanUserForm userId={user.id} />
                    ) : (
                      <BanUserForm
                        userId={user.id}
                        displayName={user.displayName}
                        openDeals={user.openDeals}
                      />
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
