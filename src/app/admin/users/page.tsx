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
import { getLocale } from "@/lib/locale-server";
import { ADMIN_USERS_PAGE } from "@/lib/page-copy";
import type { Locale } from "@/lib/locale";

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

  const locale = await getLocale();
  const copy = ADMIN_USERS_PAGE[locale];

  const params = await searchParams;
  const search = params.q ?? "";

  const users = await listUsersForAdmin(search);

  // Reputation for every row in three queries, not four per row.
  const reputations = await getReputationsFor(users.map((user) => user.id));

  return (
    <DashShell groups={adminSections({})} title={copy.title} description={copy.description}>
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <SearchInput
          label={copy.searchLabel}
          name="q"
          defaultValue={search}
          placeholder={copy.searchPlaceholder}
          className={`${inputClassName} max-w-md flex-1`}
        />
        <Button type="submit" variant="secondary" size="sm">
          {copy.search}
        </Button>
        {search ? (
          <Link
            href="/admin/users"
            className="inline-flex min-h-9 items-center self-center text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {copy.clear}
          </Link>
        ) : null}
      </form>

      <DataTable
        caption={copy.caption}
        rows={users}
        rowKey={(user) => user.id}
        columns={userColumns(reputations, copy, locale)}
        empty={
          <EmptyPanel
            icon="users"
            title={search ? copy.noMatchTitle : copy.noUsersTitle}
            secondaryAction={search ? { href: "/admin/users", label: copy.clearSearch } : undefined}
          >
            {search ? copy.tryLead : copy.appearHere}
          </EmptyPanel>
        }
      />
    </DashShell>
  );
}

function userColumns(
  reputations: Map<string, Reputation>,
  copy: (typeof ADMIN_USERS_PAGE)["en"],
  locale: Locale,
): Column<UserRow>[] {
  return [
    {
      key: "who",
      header: copy.colUser,
      primary: true,
      cell: (user) => (
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{user.displayName}</span>
            {user.role === "admin" ? <Badge tone="warning">{copy.admin}</Badge> : null}
            {user.isBanned ? <Badge tone="danger">{copy.banned}</Badge> : null}
          </span>
          <span className="mt-0.5 block truncate text-xs font-normal text-[var(--muted)]">
            {user.email}
          </span>
        </span>
      ),
    },
    {
      key: "reputation",
      header: copy.colReputation,
      cell: (user) => {
        const reputation = reputations.get(user.id);

        return reputation ? (
          <ReputationLine reputation={reputation} locale={locale} />
        ) : (
          <span className="text-xs text-[var(--muted)]">—</span>
        );
      },
    },
    {
      key: "activity",
      header: copy.colActivity,
      hideOnMobile: true,
      cell: (user) => (
        <span className="text-xs text-[var(--muted)]">
          {copy.sold} {user.dealsAsSeller} · {copy.bought} {user.dealsAsBuyer}
          <span className="block">
            {copy.joined} {user.createdAt.toLocaleDateString(locale === "ar" ? "ar" : "en-GB")}
          </span>
        </span>
      ),
    },
    {
      key: "inflight",
      header: copy.colInFlight,
      align: "end",
      cell: (user) =>
        user.openDeals > 0 ? (
          <Badge tone="info">{copy.deal(user.openDeals)}</Badge>
        ) : (
          <span className="text-xs text-[var(--muted)]">—</span>
        ),
    },
    {
      key: "actions",
      header: copy.colActions,
      align: "end",
      cell: (user) => (
        <span className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`/admin/deals?filter=all&q=${encodeURIComponent(user.displayName)}`}
            className="inline-flex min-h-9 items-center rounded-[var(--radius-control)] border border-[var(--border)] px-3 text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            {copy.theirDeals}
          </Link>

          {user.role === "admin" ? (
            <span className="text-xs text-[var(--muted)]">{copy.adminsCannotBeBanned}</span>
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
              {copy.bannedOn(
                user.bannedAt?.toLocaleDateString(locale === "ar" ? "ar" : "en-GB") ?? "",
                user.banReason,
              )}
            </Alert>
          ) : null}
        </span>
      ),
    },
  ];
}
