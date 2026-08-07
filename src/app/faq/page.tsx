import Link from "next/link";

import { faqGroupsFor } from "@/components/faq-content";
import { getLocale } from "@/lib/locale-server";
import { FAQ_PAGE } from "@/lib/page-copy";
import { Prose } from "@/components/prose";
import { Card, PageHeading } from "@/components/ui";

export const metadata = {
  title: "FAQ",
  description:
    "Common questions about escrowed game account trades: fees, timing, disputes, what happens if the seller takes the account back, and what this service does not cover.",
};

export default async function FaqPage() {
  const locale = await getLocale();
  const copy = FAQ_PAGE[locale];
  const groups = faqGroupsFor(locale);

  return (
    <Prose>
      <PageHeading
        title={copy.title}
        description={copy.intro}
      />

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.group}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              {group.group}
            </h2>
            <div className="space-y-2">
              {group.items.map((item) => (
                <Card key={item.q}>
                  <h3 className="text-sm font-semibold">{item.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-[var(--muted)]">
        {copy.notAnswered}{" "}
        <Link href="/contact" className="text-[var(--accent)] hover:underline">
          {copy.contactUs}
        </Link>
        .
      </p>
    </Prose>
  );
}
