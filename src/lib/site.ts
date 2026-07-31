// Site-wide details used across the footer, legal pages and contact page.
//
// These are the things that are specific to YOU rather than to the software, so
// they live in one place. Every value marked TODO is a placeholder — fill them in
// before the site goes live, because the legal pages reference them.
export const SITE = {
  name: "PES Escrow",
  tagline: "Trusted third party for game account trades",

  supportEmail: "contact@pesescrow.com",
  /** TODO: your Discord invite, or leave empty to hide it. */
  discord: "",
  /** TODO: your Telegram handle, or leave empty to hide it. */
  telegram: "",

  /**
   * TODO: the legal entity or person operating this service, and where.
   * Privacy law in most places requires naming who controls the data.
   */
  operator: "[Your name or company]",
  jurisdiction: "[Your country]",

  /** Used in "last updated" lines on the legal pages. */
  legalLastUpdated: "31 July 2026",
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
