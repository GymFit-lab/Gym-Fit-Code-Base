import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { dashboardContent } from "@/content/dashboard";
import { formatValue, percentChange } from "@/lib/dashboard/format";
import type { Kpi } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

/** Stat tile: label, hero number, and change vs the comparison period (icon + sign + text). */
export function KpiCard({ kpi }: { kpi: Kpi }) {
  const copy = dashboardContent.kpis[kpi.id];
  const change = percentChange(kpi.value, kpi.previous);
  const direction = change === null || change === 0 ? "flat" : change > 0 ? "up" : "down";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <article className="rounded-3xl border border-border bg-surface p-5 md:p-6">
      <h3 className="text-sm font-medium text-muted">{copy.label}</h3>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight md:text-4xl">
        {formatValue(kpi.value, kpi.format)}
      </p>
      {change !== null && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-semibold",
              direction === "up" && "bg-primary/15 text-primary-ink",
              direction === "down" && "bg-accent/10 text-accent-ink",
              direction === "flat" && "bg-fg/5 text-muted",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          <span className="text-muted">{copy.comparison}</span>
        </p>
      )}
    </article>
  );
}
