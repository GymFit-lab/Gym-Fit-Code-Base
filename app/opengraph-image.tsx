import { ImageResponse } from "next/og";

import { heroContent } from "@/content/landing";
import { ECG_BEAT_WIDTH, ECG_HEIGHT, ecgPath } from "@/lib/ecg";
import { siteConfig } from "@/lib/site-config";

export const alt = siteConfig.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BEATS = 4;

/** Brand OG image, rendered at build time — no external images or fonts. */
export default function OpengraphImage() {
  const { iron, chalk, lime, ember, muted } = siteConfig.colors;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: iron,
        backgroundImage: `radial-gradient(circle at 85% 20%, rgba(198,255,61,0.18), transparent 45%), radial-gradient(circle at 5% 95%, rgba(255,90,31,0.18), transparent 40%)`,
        color: chalk,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 44, fontWeight: 800 }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10.5" stroke={chalk} strokeWidth="2.5" />
          <circle cx="12" cy="12" r="6" stroke={lime} strokeWidth="2.5" />
          <circle cx="12" cy="12" r="2" fill={chalk} />
        </svg>
        <div style={{ display: "flex", letterSpacing: 2 }}>
          {siteConfig.wordmark.lead}
          <span style={{ color: lime }}>{siteConfig.wordmark.accent}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 112,
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: -2,
          textTransform: "uppercase",
        }}
      >
        <span>{heroContent.headline.lead}</span>
        <span style={{ color: lime }}>{heroContent.headline.punch}</span>
      </div>

      <svg
        width="1056"
        height="96"
        viewBox={`0 0 ${ECG_BEAT_WIDTH * BEATS} ${ECG_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pulse" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={lime} />
            <stop offset="100%" stopColor={ember} />
          </linearGradient>
        </defs>
        <path
          d={ecgPath(BEATS)}
          fill="none"
          stroke="url(#pulse)"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </svg>

      <div style={{ display: "flex", fontSize: 28, color: muted }}>
        {heroContent.trust.join("  ·  ")}
      </div>
    </div>,
    size,
  );
}
