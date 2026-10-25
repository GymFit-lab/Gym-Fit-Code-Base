import { useId } from "react";

import { siteConfig } from "@/lib/site-config";
import { cn, svgId } from "@/lib/utils";

const LABEL_RADIUS = 160;
const LABEL_LENGTH = Math.round(2 * Math.PI * LABEL_RADIUS) - 8;

/**
 * Decorative weight plate: rim, engraved label, grip slots and hub.
 * Colour comes from `currentColor`; `.plate-scroll` rotates it with page scroll.
 */
export function PlateRings({ className, spin = true }: { className?: string; spin?: boolean }) {
  const id = svgId("plate", useId());

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      fill="none"
      className={cn("pointer-events-none select-none", spin && "plate-scroll", className)}
    >
      <defs>
        <path
          id={id}
          d={`M200 ${200 - LABEL_RADIUS} a${LABEL_RADIUS} ${LABEL_RADIUS} 0 1 1 -0.01 0`}
        />
      </defs>
      <circle cx="200" cy="200" r="196" stroke="currentColor" strokeWidth="3" />
      <circle cx="200" cy="200" r="182" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <text
        fill="currentColor"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="600"
        letterSpacing="2"
        opacity="0.8"
      >
        <textPath href={`#${id}`} textLength={LABEL_LENGTH} lengthAdjust="spacing">
          {siteConfig.plateLabel.repeat(2)}
        </textPath>
      </text>
      {[0, 90, 180, 270].map((angle) => (
        <rect
          key={angle}
          x="186"
          y="82"
          width="28"
          height="44"
          rx="14"
          stroke="currentColor"
          strokeWidth="2"
          transform={`rotate(${angle} 200 200)`}
        />
      ))}
      <circle cx="200" cy="200" r="62" stroke="currentColor" strokeWidth="3" />
      <circle cx="200" cy="200" r="26" fill="currentColor" opacity="0.25" />
      <circle cx="200" cy="200" r="26" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
