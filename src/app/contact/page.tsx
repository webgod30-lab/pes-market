import Link from "next/link";

import { SITE, contactDetailsAreConfigured } from "@/lib/site";
import { Notice, Prose, Section } from "@/components/prose";
import { Card, PageHeading } from "@/components/ui";

export const metadata = {
  title: "Contact",
  description: "How to reach the admin, and the fastest way to get help with a specific deal.",
};

export default function ContactPage() {
  const configured = contactDetailsAreConfigured();

  type Channel = { label: string; value: string; href: string };

  const channels: Channel[] = [];

  // Widened to string because SITE is `as const`, which would otherwise pin
  // these to their literal placeholder values.
  const email: string = SITE.supportEmail;
  const discord: string = SITE.discord;
  const telegram: string = SITE.telegram;

  if (email) channels.push({ label: "Email", value: email, href: `mailto:${email}` });
  if (discord) channels.push({ label: "Discord", value: discord, href: discord });
  if (telegram) {
    channels.push({
      label: "Telegram",
      value: telegram,
      href: `https://t.me/${telegram.replace("@", "")}`,
    });
  }

  return (
    <Prose>
      <PageHeading
        title="Contact"
        description="For anything about a specific deal, the deal's own chat is faster and better."
      />

      <Card className="border-emerald-500/30">
        <h2 className="text-sm font-semibold">Have a deal open? Use the deal chat</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Every deal has a conversation on it that the admin can read. Asking there is faster — the
          admin can see the deal you mean without you explaining it — and everything said becomes part
          of the record if it later turns into a dispute. A message sent by email or Discord does not.
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Open the deal from{" "}
          <Link href="/dashboard" className="text-[var(--accent)] hover:underline">
            your deals
          </Link>{" "}
          and scroll to Messages.
        </p>
      </Card>

      <Section title="Everything else">
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
          <p>No contact channels are configured yet.</p>
        )}
      </Section>

      {!configured ? (
        <div className="mt-6">
          <Notice>
            <strong>Placeholder details.</strong> The contact channels above come from{" "}
            <code className="font-mono text-xs">src/lib/site.ts</code> — replace them with your real
            email, Discord invite or Telegram handle. An escrow service with a fake support address
            is not going to earn anyone&apos;s trust.
          </Notice>
        </div>
      ) : null}

      <Section title="Reporting something serious">
        <p>
          If you believe an account was stolen, someone is being impersonated, or you have found a
          security problem with this site, say so directly in your first message. Those go to the
          front of the queue.
        </p>
        <p>
          If a deal is going wrong right now, do not wait for a reply — open a dispute on the deal.
          That freezes the money and the account immediately, which is the thing that actually
          protects you. You can always withdraw it afterwards.
        </p>
      </Section>

      <Section title="Response times">
        <p>
          This is a one-person operation, not a call centre. Payments and releases are handled by a
          human who has to check a wallet and log into an account, which is exactly why the service
          works — but it does mean replies are not instant.
        </p>
      </Section>
    </Prose>
  );
}
