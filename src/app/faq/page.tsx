import Link from "next/link";

import { faqGroups } from "@/components/faq-content";
import { Prose } from "@/components/prose";
import { Card, PageHeading } from "@/components/ui";

export const metadata = {
  title: "FAQ",
  description:
    "Common questions about escrowed game account trades: fees, timing, disputes, what happens if the seller takes the account back, and what this service does not cover.",
};

export default function FaqPage() {
  const groups = faqGroups();

  return (
    <Prose>
      <PageHeading
        title="Questions"
        description="If your question is about a specific deal, ask on the deal itself — that keeps it on the record."
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
        Not answered here?{" "}
        <Link href="/contact" className="text-[var(--accent)] hover:underline">
          Contact us
        </Link>
        .
      </p>
    </Prose>
  );
}
