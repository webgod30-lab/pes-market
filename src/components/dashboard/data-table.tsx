import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/components/ui";

/**
 * A table on a desktop, a list of cards on a phone.
 *
 * The console's lists were `<ul>`s of cards at every width. That is right on a
 * phone and wrong on a 27-inch monitor, where an admin scanning forty deals for
 * the one with a stale deadline needs columns that line up. It is also why they
 * were not tables to begin with: a real `<table>` at 375px either scrolls
 * sideways or crushes every column, and both are miserable.
 *
 * So: one set of data, two renderings. Above `md` it is a genuine `<table>`
 * with a proper header row, which is also what a screen reader needs to
 * announce "column 3 of 5, Status". Below `md` each row becomes a card with the
 * column headers repeated as labels, because a bare value with no label is
 * meaningless once the header row is gone.
 *
 * Columns declare their own mobile behaviour rather than the table guessing:
 * `primary` is the identifier and leads the card, `hideOnMobile` drops the
 * columns that only make sense in a grid.
 */
export type Column<Row> = {
  key: string;
  header: string;
  /** Leads the mobile card, without a label. Exactly one column should set it. */
  primary?: boolean;
  /** Dropped from the mobile card entirely. */
  hideOnMobile?: boolean;
  /** Right-aligned in the table — use for money and counts. */
  align?: "start" | "end";
  cell: (row: Row) => ReactNode;
};

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  rowHref,
  empty,
}: {
  /** Announced to screen readers; not shown. Say what the table lists. */
  caption: string;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Makes the whole row navigate. */
  rowHref?: (row: Row) => string;
  empty: ReactNode;
}) {
  if (rows.length === 0) return <>{empty}</>;

  const primary = columns.find((column) => column.primary) ?? columns[0];
  const rest = columns.filter((column) => column !== primary && !column.hideOnMobile);

  return (
    <>
      {/* --- desktop --- */}
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-2.5 text-overline uppercase text-[var(--muted)]",
                    column.align === "end" ? "text-right" : "text-left",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-[var(--border)] bg-[var(--surface)] transition-colors last:border-0 hover:bg-[var(--surface-2)]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      column.align === "end" && "text-right tabular-nums",
                    )}
                  >
                    {/* The link lives in the identifying cell rather than
                        wrapping the row: an <a> cannot contain <td>s, and a
                        row-level click handler is invisible to a keyboard. */}
                    {column === primary && rowHref ? (
                      <Link
                        href={rowHref(row)}
                        className="rounded-[var(--radius-control)] font-medium hover:text-[var(--accent)] hover:underline"
                      >
                        {column.cell(row)}
                      </Link>
                    ) : (
                      column.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- phone --- */}
      <ul className="space-y-2 md:hidden">
        {rows.map((row) => {
          const card = (
            <div
              className={cn(
                "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4",
                rowHref && "transition-colors hover:border-[var(--accent)]/40",
              )}
            >
              <div className="font-medium">{primary.cell(row)}</div>

              <dl className="mt-2.5 space-y-1.5">
                {rest.map((column) => (
                  <div key={column.key} className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-xs text-[var(--muted)]">{column.header}</dt>
                    <dd className="min-w-0 text-right text-sm">{column.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );

          return (
            <li key={rowKey(row)}>
              {rowHref ? (
                <Link href={rowHref(row)} className="block">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
