"use client";

import { useId, useState } from "react";

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
import { svgId } from "@/lib/utils";

/** Single-series line chart with a crosshair tooltip (hover, or focus + arrow keys). */
export function LineChart({
  points,
  format,
  title,
}: {
  points: ChartPoint[];
  format: ValueFormat;
  /** Used for the accessible name and the screen-reader table caption. */
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const gradientId = svgId("line-area", useId());

  if (points.length === 0) return null;

  const { max, ticks } = niceScale(Math.max(...points.map((p) => p.value)));
  const step = points.length > 1 ? INNER_W / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: CHART.left + i * step,
    y: CHART.top + INNER_H * (1 - p.value / max),
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c.y}`).join(" ");
  const baseline = CHART.top + INNER_H;
  const area = `${line} L${coords.at(-1)?.x ?? CHART.left} ${baseline} L${CHART.left} ${baseline} Z`;
  const activePoint = active === null ? null : points[active];
  const activeCoord = active === null ? null : coords[active];

  function handlePointer(event: React.PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setActive(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  }

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
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary-ink)", stopOpacity: 0.22 }} />
            <stop offset="100%" style={{ stopColor: "var(--primary-ink)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        <YAxis ticks={ticks} max={max} formatTick={(v) => formatCompact(v, format)} />

        {points.map((point, i) => (
          <text
            key={point.label}
            x={coords[i]?.x}
            y={CHART.height - 8}
            textAnchor="middle"
            className="fill-muted text-[11px]"
          >
            {point.label}
          </text>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          className="stroke-primary-ink"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {activeCoord && (
          <g>
            <line
              x1={activeCoord.x}
              x2={activeCoord.x}
              y1={CHART.top}
              y2={baseline}
              className="stroke-border-strong"
              strokeDasharray="3 3"
            />
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r={5}
              className="fill-primary-ink stroke-surface"
              strokeWidth={2}
            />
          </g>
        )}

        {/* Hit area larger than the line, so the whole plot responds to hover. */}
        <rect
          x={CHART.left - step / 2}
          y={CHART.top}
          width={INNER_W + step}
          height={INNER_H}
          fill="transparent"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setActive(null)}
        />
      </svg>

      {activePoint && activeCoord && active !== null && (
        <ChartTooltip
          x={activeCoord.x}
          y={activeCoord.y}
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
