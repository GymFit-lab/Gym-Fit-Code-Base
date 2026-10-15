import { dashboardContent } from "@/content/dashboard";
import { cn } from "@/lib/utils";

export type ChartPoint = { label: string; value: number };
export type ValueFormat = "number" | "currency";

/** Chart canvas in SVG user units; the SVG scales to its container width. */
export const CHART = { width: 640, height: 240, top: 16, right: 16, bottom: 32, left: 60 };
export const INNER_W = CHART.width - CHART.left - CHART.right;
export const INNER_H = CHART.height - CHART.top - CHART.bottom;

/** Hover/focus tooltip positioned over the SVG in percentages, clamped at the edges. */
export function ChartTooltip({
  x,
  y,
  index,
  count,
  label,
  value,
}: {
  x: number;
  y: number;
  index: number;
  count: number;
  label: string;
  value: string;
}) {
  const shift = index === 0 ? "-15%" : index === count - 1 ? "-85%" : "-50%";
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 rounded-xl border border-border-strong bg-surface px-3 py-2 shadow-xl"
      style={{
        left: `${(x / CHART.width) * 100}%`,
        top: `${(y / CHART.height) * 100}%`,
        transform: `translate(${shift}, calc(-100% - 12px))`,
      }}
    >
      <p className="text-xs whitespace-nowrap text-muted">{label}</p>
      <p className="font-mono text-sm font-bold whitespace-nowrap text-fg">{value}</p>
    </div>
  );
}

/** Visually hidden data table so the chart's numbers are available to screen readers. */
export function ChartSrTable({
  caption,
  points,
  formatValue,
}: {
  caption: string;
  points: ChartPoint[];
  formatValue: (value: number) => string;
}) {
  const { chartTable } = dashboardContent;
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{chartTable.period}</th>
          <th scope="col">{chartTable.value}</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.label}>
            <th scope="row">{point.label}</th>
            <td>{formatValue(point.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Recessive horizontal gridlines + y-axis tick labels. */
export function YAxis({
  ticks,
  max,
  formatTick,
}: {
  ticks: number[];
  max: number;
  formatTick: (value: number) => string;
}) {
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => {
        const y = CHART.top + INNER_H * (1 - tick / max);
        return (
          <g key={tick}>
            <line
              x1={CHART.left}
              x2={CHART.width - CHART.right}
              y1={y}
              y2={y}
              className={cn("stroke-border", tick === 0 && "stroke-border-strong")}
              strokeWidth={1}
            />
            <text
              x={CHART.left - 10}
              y={y}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted font-mono text-[11px]"
            >
              {formatTick(tick)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
