import Link from "next/link";

import { SITE, contactDetailsAreConfigured } from "@/lib/site";
import { Notice, Prose, Section } from "@/components/prose";
import { Card, PageHeading } from "@/components/ui";
import { getLocale } from "@/lib/locale-server";
import { CONTACT_PAGE } from "@/lib/page-copy";

export const metadata = {
  title: "Contact",
  description: "How to reach the admin, and the fastest way to get help with a specific deal.",
};

export default async function ContactPage() {
  const locale = await getLocale();
  const copy = CONTACT_PAGE[locale];
  const configured = contactDetailsAreConfigured();

  type Channel = { label: string; value: string; href: string };

  const channels: Channel[] = [];

  // Widened to string because SITE is `as const`, which would otherwise pin
  // these to their literal placeholder values.
  const email: string = SITE.supportEmail;
  const discord: string = SITE.discord;
  const telegram: string = SITE.telegram;

  if (email) channels.push({ label: copy.emailLabel, value: email, href: `mailto:${email}` });
  if (discord) channels.push({ label: copy.discordLabel, value: discord, href: discord });
  if (telegram) {
    channels.push({
      label: copy.telegramLabel,
      value: telegram,
      href: `https://t.me/${telegram.replace("@", "")}`,
    });
  }

  return (
    <Prose>
      <PageHeading title={copy.title} description={copy.intro} />

      <Card className="border-emerald-500/30">
        <h2 className="text-sm font-semibold">{copy.dealChatTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{copy.dealChatBody}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {copy.dealChatOpenLead}{" "}
          <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
            {copy.dealChatOpenLink}
          </Link>{" "}
          {copy.dealChatOpenTail}
        </p>
      </Card>

      <Section title={copy.everythingElse}>
        {channels.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-emerald-500/40"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{channel.label}</p>
                <p className="mt-1 break-all text-sm text-[var(--foreground)]">{channel.value}</p>
              </a>
            ))}
          </div>
        ) : (
          <p>{copy.noChannels}</p>
        )}
      </Section>

      {!configured ? (
        <div className="mt-6">
          <Notice>
            <strong>{copy.placeholderBold}</strong> {copy.placeholderBefore}{" "}
            <code className="font-mono text-xs">src/lib/site.ts</code> {copy.placeholderAfter}
          </Notice>
        </div>
      ) : null}

      <Section title={copy.reportingTitle}>
        <p>{copy.reportingBody1}</p>
        <p>{copy.reportingBody2}</p>
      </Section>

      <Section title={copy.responseTitle}>
        <p>{copy.responseBody}</p>
      </Section>
    </Prose>
  );
}
