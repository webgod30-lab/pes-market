// Site-wide details used across the footer, legal pages and contact page.
//
// These are the things that are specific to YOU rather than to the software, so
// they live in one place. Every value marked TODO is a placeholder — fill them in
// before the site goes live, because the legal pages reference them.
export const SITE = {
  /**
   * The brand, written the one way it is ever written.
   *
   * The ".com" is part of the name rather than a decoration — the domain is
   * the brand, which is the usual shape for a service people are told about
   * in a chat message and have to remember long enough to type.
   */
  name: "PESescrow.com",
  tagline: "Trusted third party for game account trades",

  supportEmail: "contact@pesescrow.com",
  /** TODO: your Discord invite, or leave empty to hide it. */
  discord: "",
  /** TODO: your Telegram handle, or leave empty to hide it. */
  telegram: "",

  /**
   * TODO: the legal entity or person operating this service.
   *
   * Must be the real operator — your own name, or the exact name on your UAE
   * trade licence. This is the entity the terms make responsible for holding
   * escrow funds, and the data controller named in the privacy policy, so a
   * borrowed or invented name is not a placeholder problem but a legal one.
   */
  operator: "Pes Escrow WORKS-LLC",

  /** Where the service is operated from. Determines which privacy law applies. */
  jurisdiction: "Dubai, United Arab Emirates",

  /** Used in "last updated" lines on the legal pages. */
  legalLastUpdated: "31 July 2026",

  /**
   * The track record of the promoter network, from BEFORE this platform.
   *
   * These are real figures from the operation that has been running account
   * swaps by hand, not numbers this database can produce — the site itself is
   * new. That distinction is not pedantry, it is what keeps the claim true: a
   * promoter who reads "200 promoters" and then sees a handful of deals on the
   * site will conclude the number is invented unless the page has already told
   * them it belongs to the network rather than the software. Every page that
   * shows these says so.
   *
   * Update them here. They appear in one place, so there is no second copy to
   * forget — and keep them behind what you can actually evidence if somebody
   * asks, because a promoter will repeat them and be the one asked.
   */
  network: {
    /** Promoters active across the network. */
    promoters: 200,
    /** Paid out to them per month, in whole US dollars. */
    monthlyPayoutUsd: 130_000,
  },
} as const;

/**
 * Whether the legal pages can stand on their own.
 *
 * Separate from the contact check on purpose: naming who controls the data is a
 * legal requirement in most jurisdictions, and having a working support address
 * does not satisfy it.
 */
export function legalDetailsAreConfigured(): boolean {
  return !SITE.operator.startsWith("[") && !SITE.jurisdiction.startsWith("[");
}

/** Whether there is at least one real way to reach a human. */
export function contactDetailsAreConfigured(): boolean {
  return Boolean(SITE.supportEmail) && !SITE.supportEmail.includes("example.com");
}
