import { ImageResponse } from "next/og";

import { BRAND, ICON_TAG_PATH, PE_PATH } from "@/components/brand";

// Home-screen icon for iOS, which ignores SVG favicons and wants a PNG.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Rendered by satori rather than a browser.
 *
 * The mark is drawn as paths rather than typeset, which matters more here than
 * anywhere: satori has no access to Chakra Petch unless the font binary is
 * shipped alongside it, and a silently substituted fallback would put a
 * different logo on every iOS home screen. Paths cannot drift.
 *
 * iOS rounds and masks the corners itself, so this bleeds to the edges instead
 * of drawing its own tile.
 */
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
          background: BRAND.ink,
        }}
      >
        <svg width="132" height="132" viewBox="0 0 64 64">
          <path d={ICON_TAG_PATH} fill={BRAND.emerald} />
          <path d={PE_PATH} fill={BRAND.ink} />
        </svg>
      </div>
    ),
    size,
  );
}
