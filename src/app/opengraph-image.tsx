import { ImageResponse } from "next/og";

import { BRAND, KEYHOLE_BOW, KEYHOLE_STEM_PATH, SHIELD_PATH } from "@/components/brand";
import { SITE } from "@/lib/site";

// The card people see when the link is pasted into Discord, WhatsApp or X —
// which is how almost everyone will first meet this service. Generated rather
// than shipped as a binary so it cannot fall out of step with the brand.
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          // Deep emerald wash rather than flat ink: the card is the first thing
          // most people see of this brand, usually in a crowded chat feed.
          backgroundImage: `linear-gradient(135deg, ${BRAND.ink} 55%, ${BRAND.vault} 100%)`,
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Emblem on its tile. Flat fills — satori is not a browser, and inline
            SVG gradients are the first thing to fail in it. */}
        <div
          style={{
            display: "flex",
            width: 112,
            height: 112,
            borderRadius: 26,
            backgroundImage: `linear-gradient(135deg, ${BRAND.vault}, ${BRAND.vaultDeep})`,
            border: `2px solid ${BRAND.emerald}33`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="74" height="74" viewBox="0 0 64 64">
            <path d={SHIELD_PATH} fill={BRAND.emerald} />
            <circle cx={KEYHOLE_BOW.cx} cy={KEYHOLE_BOW.cy} r={KEYHOLE_BOW.r} fill={BRAND.vault} />
            <path d={KEYHOLE_STEM_PATH} fill={BRAND.vault} />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: BRAND.paper,
            marginTop: 40,
            letterSpacing: "-0.02em",
          }}
        >
          PES
          <span style={{ color: BRAND.emerald }}>escrow</span>
          <span style={{ color: BRAND.muted, fontWeight: 400 }}>.com</span>
        </div>

        <div style={{ display: "flex", fontSize: 34, color: "#94a3b8", marginTop: 18, maxWidth: 900 }}>
          You two agreed the deal. We make sure nobody gets robbed.
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#64748b", marginTop: 36 }}>
          Account held encrypted · Money held in escrow · Neither moves until the trade works
        </div>
      </div>
    ),
    size,
  );
}
