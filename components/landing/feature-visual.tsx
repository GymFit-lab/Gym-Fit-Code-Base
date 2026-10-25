import { BellRing, Check } from "lucide-react";

import { dashboardMockup, featureVisuals as v, type FeatureVisualKind } from "@/content/landing";
import { cn, cssVars, initials } from "@/lib/utils";

/** Bars that sit part-grown and stretch to full height when the tile is hovered. */
function Bars({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values);
  return (
    <div className={cn("flex items-end gap-1.5", className)}>
      {values.map((value, i) => (
        <span
          key={i}
          className="fv-bar flex-1 rounded-t-md bg-primary"
          style={{ height: `${(value / max) * 100}%`, ...cssVars({ "--d": `${i * 35}ms` }) }}
        />
      ))}
    </div>
  );
}

/** Small decorative illustration for each bento tile; animates on tile hover (see globals.css). */
export function FeatureVisual({ kind }: { kind: FeatureVisualKind }) {
  const chip = "rounded-xl border border-border bg-surface px-3 py-2 text-xs";

  switch (kind) {
    case "clients":
      return (
        <ul className="space-y-2">
          {dashboardMockup.clients.slice(0, 4).map((c, i) => (
            <li
              key={c.name}
              className="fv-slide flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 text-sm"
              style={cssVars({ "--d": `${i * 50}ms` })}
            >
              <span className="grid size-8 place-items-center rounded-full bg-fg/10 text-xs font-bold">
                {initials(c.name)}
              </span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <span className="text-xs text-muted">{c.plan}</span>
            </li>
          ))}
        </ul>
      );
    case "renewals":
      return (
        <div className={chip}>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">{v.renewals.label}</span>
            <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-iron">
              {v.renewals.action}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fg/10">
            <div className="fv-fill h-full rounded-full bg-accent" />
          </div>
        </div>
      );
    case "attendance":
      return <Bars values={dashboardMockup.attendance.map((d) => d.value)} className="h-16" />;
    case "progress": {
      const data = dashboardMockup.progress;
      const min = Math.min(...data);
      const max = Math.max(...data);
      const points = data
        .map(
          (value, i) =>
            `${(i / (data.length - 1)) * 100},${4 + ((max - value) / (max - min || 1)) * 32}`,
        )
        .join(" ");
      return (
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full">
          <polyline
            points={points}
            pathLength={1}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="fv-draw"
          />
        </svg>
      );
    }
    case "plans":
      return (
        <ul className="flex flex-wrap gap-2">
          {v.plans.map((plan, i) => (
            <li
              key={plan}
              className={cn(chip, "fv-slide flex items-center gap-2")}
              style={cssVars({ "--d": `${i * 60}ms` })}
            >
              <Check className="size-3.5 text-primary-ink" />
              {plan}
            </li>
          ))}
        </ul>
      );
    case "trainers":
      return (
        <div className="fv-stack flex">
          {v.trainers.map((name) => (
            <span
              key={name}
              className="grid size-10 place-items-center rounded-full border-2 border-bg bg-primary text-xs font-bold text-iron"
            >
              {initials(name)}
            </span>
          ))}
        </div>
      );
    case "payments":
      return (
        <div className={cn(chip, "fv-slide inline-flex items-center gap-2")}>
          <BellRing className="size-3.5 text-accent-ink" />
          <span className="font-semibold">{v.payments.amount}</span>
          <span className="text-muted">· {v.payments.status}</span>
        </div>
      );
    case "reports":
      return (
        <div>
          <p className="mb-2 text-xs text-muted">{v.reports.label}</p>
          <Bars values={v.reports.values} className="h-20" />
        </div>
      );
  }
}
