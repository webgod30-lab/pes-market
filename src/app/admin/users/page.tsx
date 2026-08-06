import Link from "next/link";

import { requireUserOrProblem } from "@/lib/dal";
import { listUsersForAdmin } from "@/lib/admin";
import { getReputationsFor } from "@/lib/reviews";
import { BanUserForm, UnbanUserForm } from "@/components/user-moderation";
import { ReputationLine } from "@/components/reputation";
import { adminSections } from "@/components/dashboard/dash-nav";
import { DashShell } from "@/components/dashboard/dash-shell";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyPanel } from "@/components/dashboard/empty-panel";
import { Alert, Badge, Button, inputClassName, SearchInput, SetupProblem } from "@/components/ui";
import type { getReputation } from "@/lib/reviews";

export const metadata = { title: "Users — admin" };

type UserRow = Awaited<ReturnType<typeof listUsersForAdmin>>[number];
type Reputation = Awaited<ReturnType<typeof getReputation>>;

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

  // Reputation for every row in three queries, not four per row.
  const reputations = await getReputationsFor(users.map((user) => user.id));

  return (
    <DashShell
      groups={adminSections({})}
      title="Users"
      description="Banning takes effect on the person's next request — the session is re-checked against the database, not trusted."
    >
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          label="Search users"
          name="q"
          defaultValue={search}
          placeholder="Search name or email"
          className={`${inputClassName} max-w-md flex-1`}
        />
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
        {search ? (
          <Link
            href="/admin/users"
            className="inline-flex min-h-9 items-center self-center text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <DataTable
        caption="Registered accounts"
        rows={users}
        rowKey={(user) => user.id}
        columns={userColumns(reputations)}
        empty={
          <EmptyPanel
            icon="users"
            title={search ? "Nobody matches that search" : "No users yet"}
            secondaryAction={search ? { href: "/admin/users", label: "Clear the search" } : undefined}
          >
            {search
              ? "Try part of a display name or an email address."
              : "Accounts appear here as soon as somebody registers."}
          </EmptyPanel>
        }
      />
    </DashShell>
  );
}

function userColumns(reputations: Map<string, Reputation>): Column<UserRow>[] {
  return [
    {
      key: "who",
      header: "User",
      primary: true,
      cell: (user) => (
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{user.displayName}</span>
            {user.role === "admin" ? <Badge tone="warning">admin</Badge> : null}
            {user.isBanned ? <Badge tone="danger">banned</Badge> : null}
          </span>
          <span className="mt-0.5 block truncate text-xs font-normal text-[var(--muted)]">
            {user.email}
          </span>
        </span>
      ),
    },
    {
      key: "reputation",
      header: "Reputation",
      cell: (user) => {
        const reputation = reputations.get(user.id);

        return reputation ? (
          <ReputationLine reputation={reputation} />
        ) : (
          <span className="text-xs text-[var(--muted)]">—</span>
        );
      },
    },
    {
      key: "activity",
      header: "Activity",
      hideOnMobile: true,
      cell: (user) => (
        <span className="text-xs text-[var(--muted)]">
          sold {user.dealsAsSeller} · bought {user.dealsAsBuyer}
          <span className="block">joined {user.createdAt.toLocaleDateString("en-GB")}</span>
        </span>
      ),
    },
    {
      key: "inflight",
      header: "In flight",
      align: "end",
      cell: (user) =>
        user.openDeals > 0 ? (
          <Badge tone="info">
            {user.openDeals} deal{user.openDeals === 1 ? "" : "s"}
          </Badge>
        ) : (
          <span className="text-xs text-[var(--muted)]">—</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      cell: (user) => (
        <span className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`/admin/deals?filter=all&q=${encodeURIComponent(user.displayName)}`}
            className="inline-flex min-h-9 items-center rounded-[var(--radius-control)] border border-[var(--border)] px-3 text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
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

          {user.isBanned && user.banReason ? (
            <Alert tone="danger" className="mt-1 w-full text-xs">
              Banned {user.bannedAt?.toLocaleDateString("en-GB")}: {user.banReason}
            </Alert>
          ) : null}
        </span>
      ),
    },
  ];
}
