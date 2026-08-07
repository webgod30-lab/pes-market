import { ImageResponse } from "next/og";

import { BRAND, ICON_TAG_PATH, PE_PATH } from "@/components/brand";
import { SITE } from "@/lib/site";

// The card people see when the link is pasted into Discord, WhatsApp or X —
// which is how almost everyone will first meet this service. Generated rather
// than shipped as a binary so it cannot fall out of step with the brand.
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The 5c lockup at card size.
 *
 * The wordmark is built the same way the HTML one is — a clipped emerald tag
 * holding "PES", the rest of the name beside it — but with the clip written as
 * a CSS `clipPath` on a div, which satori does support. The "PE" mark keeps its
 * drawn paths, for the reason given in apple-icon.tsx.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BRAND.ink,
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* The mark on its panel, echoing the design's own dark board. */}
        <div
          style={{
            display: "flex",
            width: 108,
            height: 108,
            background: BRAND.inkPanel,
            border: `1px solid ${BRAND.line}`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="72" height="72" viewBox="0 0 64 64">
            <path d={ICON_TAG_PATH} fill={BRAND.emerald} />
            <path d={PE_PATH} fill={BRAND.ink} />
          </svg>
        </div>

        <div style={{ display: "flex", alignItems: "stretch", gap: 10, marginTop: 44 }}>
          <div
            style={{
              display: "flex",
              background: BRAND.emerald,
              color: BRAND.ink,
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1,
              padding: "16px 22px 22px",
              clipPath: "polygon(0 0, 100% 0, 100% 68%, 82% 100%, 0 100%)",
            }}
          >
            PES
          </div>
          <div
            style={{
              display: "flex",
              color: BRAND.paper,
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1,
              padding: "16px 0 22px",
            }}
          >
            ESCROW
          </div>
        </div>

        {/* The status line from the design, carrying the tagline. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            border: `1px solid ${BRAND.line}`,
            padding: "10px 16px",
            marginTop: 32,
            alignSelf: "flex-start",
          }}
        >
          <div style={{ display: "flex", width: 12, height: 12, background: BRAND.emerald }} />
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: BRAND.muted }}>
            ACCOUNT HELD ENCRYPTED · MONEY HELD IN ESCROW
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 34, color: "#94a3b8", marginTop: 34, maxWidth: 900 }}>
          You two agreed the deal. We make sure nobody gets robbed.
        </div>
      </div>
    ),
    size,
  );
}
