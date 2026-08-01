import { ImageResponse } from "next/og";

// Home-screen icon for iOS, which ignores SVG favicons and wants a PNG.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#34d399",
        }}
      >
        <svg width="130" height="130" viewBox="0 0 64 64">
          <path
            d="M32 12 L48 18 V32.5 C48 41.2 41.1 47.8 32 51.5 C22.9 47.8 16 41.2 16 32.5 V18 Z"
            fill="#022c22"
          />
          <circle cx="32" cy="27.5" r="5" fill="#34d399" />
          <path d="M29.7 30.2 h4.6 l-1.2 9.3 h-2.2 z" fill="#34d399" />
        </svg>
      </div>
    ),
    size,
  );
}
