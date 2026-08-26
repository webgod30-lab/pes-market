import { translator } from "@/lib/dictionary";
import type { Locale } from "@/lib/locale";

/**
 * The columns recorded about one account in a swap.
 *
 * Structurally the seller's half of a Deal. The buyer's half has the same
 * shape under `counter` names, so a caller renders the second one by handing
 * over those five fields instead — see the deal page.
 */
export type AccountFacts = {
  platform: string | null;
  level: number | null;
  teamStrength: number | null;
  epics: number | null;
  epicPlayers: string | null;
};

/**
 * Those facts, as labelled pairs.
 *
 * One component for all three places a swap is read — the trader's deal page,
 * the invite preview, and the admin console — because the alternative was
 * three hand-written lines that had already started to disagree about which
 * facts were worth showing.
 *
 * Anything not recorded is left out rather than shown as a dash. A deal where
 * two boxes were filled in should read as two facts, not as a form with holes
 * in it; and nothing recorded at all renders nothing, so an old deal from
 * before these columns existed looks the way it always did.
 */
export function AccountFactList({ facts, locale }: { facts: AccountFacts; locale: Locale }) {
  const t = translator(locale);

  const rows: { label: string; value: string; numeric: boolean }[] = [];

  if (facts.platform) {
    rows.push({ label: t("deal.account.platform"), value: facts.platform, numeric: false });
  }

  if (facts.level !== null) {
    rows.push({ label: t("deal.account.level"), value: String(facts.level), numeric: true });
  }

  if (facts.teamStrength !== null) {
    rows.push({
      label: t("deal.account.strength"),
      value: String(facts.teamStrength),
      numeric: true,
    });
  }

  if (facts.epics !== null) {
    rows.push({ label: t("deal.account.epics"), value: String(facts.epics), numeric: true });
  }

  if (facts.epicPlayers) {
    rows.push({ label: t("deal.account.epicPlayers"), value: facts.epicPlayers, numeric: false });
  }

  if (rows.length === 0) return null;

  return (
    <dl className="mt-3 space-y-1.5 text-xs">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-4 border-b border-[var(--border)] pb-1.5 last:border-0 last:pb-0"
        >
          <dt className="shrink-0 text-[var(--muted)]">{row.label}</dt>
          <dd className={row.numeric ? "text-end font-medium tabular-nums" : "text-end font-medium"}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
