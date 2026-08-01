import { ImageResponse } from "next/og";

// The card people see when the link is pasted into Discord, WhatsApp or X —
// which is how almost everyone will first meet this service. Generated rather
// than shipped as a binary so it stays in sync with the brand.
export const alt = "PES Escrow — trusted third party for game account trades";
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
          background: "#0b0f14",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Mark */}
        <div
          style={{
            display: "flex",
            width: 108,
            height: 108,
            borderRadius: 24,
            background: "#34d399",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="72" height="72" viewBox="0 0 64 64">
            <path
              d="M32 12 L48 18 V32.5 C48 41.2 41.1 47.8 32 51.5 C22.9 47.8 16 41.2 16 32.5 V18 Z"
              fill="#022c22"
            />
            <circle cx="32" cy="27.5" r="5" fill="#34d399" />
            <path d="M29.7 30.2 h4.6 l-1.2 9.3 h-2.2 z" fill="#34d399" />
          </svg>
        </div>

        <div style={{ display: "flex", fontSize: 62, fontWeight: 700, color: "#e7edf4", marginTop: 40 }}>
          PES
          <span style={{ color: "#34d399" }}>Escrow</span>
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
