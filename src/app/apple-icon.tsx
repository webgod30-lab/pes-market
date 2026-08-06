import { ImageResponse } from "next/og";

import { BRAND, KEYHOLE_BOW, KEYHOLE_STEM_PATH, SHIELD_PATH } from "@/components/brand";

// Home-screen icon for iOS, which ignores SVG favicons and wants a PNG.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Rendered by satori rather than a browser, so this is deliberately plainer
 * than the React emblem: flat fills instead of SVG gradients, and no inner
 * bevel. The gradient goes on the wrapping div, where it is CSS and reliably
 * supported.
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
          backgroundImage: `linear-gradient(135deg, ${BRAND.vault}, ${BRAND.vaultDeep})`,
        }}
      >
        <svg width="118" height="118" viewBox="0 0 64 64">
          <path d={SHIELD_PATH} fill={BRAND.emerald} />
          <circle cx={KEYHOLE_BOW.cx} cy={KEYHOLE_BOW.cy} r={KEYHOLE_BOW.r} fill={BRAND.vault} />
          <path d={KEYHOLE_STEM_PATH} fill={BRAND.vault} />
        </svg>
      </div>
    ),
    size,
  );
}
