"use client";

import { useState } from "react";

import {
  CHART,
  ChartSrTable,
  ChartTooltip,
  INNER_H,
  INNER_W,
  YAxis,
  type ChartPoint,
  type ValueFormat,
} from "@/components/dashboard/charts/chart-parts";
import { niceScale } from "@/lib/dashboard/chart-scale";
import { formatCompact, formatValue } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

/** Bar path with 4px rounded data-end (top) and a square base anchored to the baseline. */
function barPath(x: number, y: number, width: number, height: number) {
  const r = Math.min(4, width / 2, height);
  const bottom = y + height;
  return `M${x} ${bottom} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + width - r} Q${x + width} ${y} ${x + width} ${y + r} V${bottom} Z`;
}

/** Single-series vertical bar chart with a per-bar tooltip (hover, or focus + arrow keys). */
export function BarChart({
  points,
  format,
  title,
}: {
  points: ChartPoint[];
  format: ValueFormat;
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  if (points.length === 0) return null;

  const { max, ticks } = niceScale(Math.max(...points.map((p) => p.value)));
  const band = INNER_W / points.length;
  const barWidth = Math.min(48, band * 0.6);
  const bars = points.map((p, i) => {
    const height = INNER_H * (p.value / max);
    return {
      x: CHART.left + i * band + (band - barWidth) / 2,
      y: CHART.top + INNER_H - height,
      height,
      center: CHART.left + i * band + band / 2,
    };
  });
  const activePoint = active === null ? null : points[active];
  const activeBar = active === null ? null : bars[active];

  function handleKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    setActive((i) => Math.min(points.length - 1, Math.max(0, (i ?? -1) + delta)));
  }

  return (
    <div
      className="relative rounded-lg"
      tabIndex={0}
      aria-label={title}
      onKeyDown={handleKey}
      onBlur={() => setActive(null)}
    >
      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="h-auto w-full"
        aria-hidden="true"
      >
        <YAxis ticks={ticks} max={max} formatTick={(v) => formatCompact(v, format)} />

        {points.map((point, i) => {
          const bar = bars[i];
          if (!bar) return null;
          return (
            <g key={point.label}>
              <path
                d={barPath(bar.x, bar.y, barWidth, bar.height)}
                className={cn(
                  "fill-primary-ink transition-opacity",
                  active !== null && active !== i && "opacity-45",
                )}
              />
              <text
                x={bar.center}
                y={CHART.height - 8}
                textAnchor="middle"
                className="fill-muted text-[11px]"
              >
                {point.label}
              </text>
              {/* Full-height hit target — bigger than the bar itself. */}
              <rect
                x={CHART.left + i * band}
                y={CHART.top}
                width={band}
                height={INNER_H}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              />
            </g>
          );
        })}
      </svg>

      {activePoint && activeBar && active !== null && (
        <ChartTooltip
          x={activeBar.center}
          y={activeBar.y}
          index={active}
          count={points.length}
          label={activePoint.label}
          value={formatValue(activePoint.value, format)}
        />
      )}

      <ChartSrTable caption={title} points={points} formatValue={(v) => formatValue(v, format)} />
    </div>
  );
}
