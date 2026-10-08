import { useId } from "react";

import { ECG_BEAT_WIDTH, ECG_HEIGHT, ecgPath } from "@/lib/ecg";
import { cn, svgId } from "@/lib/utils";

/** Decorative heartbeat line that draws itself in, then sends a pulse along it. */
export function EcgLine({ beats = 4, className }: { beats?: number; className?: string }) {
  const id = svgId("ecg", useId());
  const d = ecgPath(beats);

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${ECG_BEAT_WIDTH * beats} ${ECG_HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("ecg-mask h-16 w-full", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={3}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="ecg-draw"
      />
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="ecg-travel"
      />
    </svg>
  );
}
