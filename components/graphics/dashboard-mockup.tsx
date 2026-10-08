import { Search } from "lucide-react";

import { dashboardMockup as m, type ClientStatus, type Tone } from "@/content/landing";
import { cn, cssVars, initials } from "@/lib/utils";

const statusStyles: Record<ClientStatus, string> = {
  active: "bg-primary/15 text-primary-ink",
  due: "bg-accent/15 text-accent-ink",
  expired: "bg-fg/10 text-muted",
};

const toneText: Record<Tone, string> = {
  primary: "text-primary-ink",
  accent: "text-accent-ink",
  muted: "text-muted",
};

const toneDot: Record<Tone, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  muted: "bg-muted",
};

/** Illustrative dashboard built from sample data. `data-hotspot` marks areas for the product tour. */
export function DashboardMockup({ className }: { className?: string }) {
  const maxAttendance = Math.max(...m.attendance.map((d) => d.value));
  const minW = Math.min(...m.progress);
  const maxW = Math.max(...m.progress);
  const points = m.progress
    .map((v, i) => {
      const x = (i / (m.progress.length - 1)) * 200;
      const y = 8 + ((maxW - v) / (maxW - minW || 1)) * 44;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div
      role="img"
      aria-label={m.ariaLabel}
      className={cn(
        "overflow-hidden rounded-2xl border border-border-strong bg-surface text-left text-fg shadow-2xl shadow-black/40",
        className,
      )}
    >
      {/* Window chrome */}
      <div aria-hidden="true" className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-accent" />
        <span className="size-2.5 rounded-full bg-[#ffb347]" />
        <span className="size-2.5 rounded-full bg-primary" />
        <span className="ml-3 font-mono text-xs text-muted">{m.windowTitle}</span>
        <span className="ml-auto rounded-full border border-border-strong px-2 py-0.5 font-mono text-[0.65rem] tracking-wider text-muted uppercase">
          {m.sampleBadge}
        </span>
      </div>

      <div aria-hidden="true" className="grid grid-cols-[9rem_1fr] max-md:grid-cols-1">
        {/* Sidebar */}
        <nav className="border-r border-border p-3 max-md:hidden">
          <p className="mb-3 truncate px-2 text-xs font-semibold text-muted">{m.gymName}</p>
          <ul className="space-y-1 text-sm">
            {m.nav.map((item, i) => (
              <li
                key={item}
                className={cn(
                  "rounded-lg px-2 py-1.5",
                  i === 0 ? "bg-primary font-semibold text-iron" : "text-muted",
                )}
              >
                {item}
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 p-3 md:p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-muted">
            <Search className="size-3.5" />
            {m.searchPlaceholder}
          </div>

          {/* KPIs */}
          <div data-hotspot="kpis" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {m.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-border bg-surface-2 p-3">
                <p className="text-[0.7rem] text-muted">{kpi.label}</p>
                <p className="mt-1 font-display text-3xl leading-none tracking-wide">{kpi.value}</p>
                <p className={cn("mt-1 text-[0.7rem]", toneText[kpi.tone])}>{kpi.trend}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            {/* Clients */}
            <div
              data-hotspot="clients"
              className="rounded-xl border border-border bg-surface-2 p-3 lg:col-span-3"
            >
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold">{m.clientsTitle}</span>
                <span className="text-primary-ink">{m.clientsAction}</span>
              </div>
              <ul className="divide-y divide-border">
                {m.clients.map((c) => (
                  <li key={c.name} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className="grid size-6 place-items-center rounded-full bg-fg/10 text-[0.6rem] font-bold">
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="hidden text-muted sm:inline">{c.plan}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                        statusStyles[c.status],
                      )}
                    >
                      {m.statusLabels[c.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Attendance */}
            <div
              data-hotspot="attendance"
              className="rounded-xl border border-border bg-surface-2 p-3 lg:col-span-2"
            >
              <p className="mb-2 text-xs font-semibold">{m.attendanceTitle}</p>
              <div className="flex h-28 items-end gap-1.5">
                {m.attendance.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="bar-grow w-full rounded-t-md bg-primary"
                      style={{
                        height: `${(d.value / maxAttendance) * 88}px`,
                        ...cssVars({ "--d": `${i * 70}ms` }),
                      }}
                    />
                    <span className="text-[0.6rem] text-muted">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {/* Renewals */}
            <div
              data-hotspot="renewals"
              className="rounded-xl border border-border bg-surface-2 p-3"
            >
              <p className="mb-2 text-xs font-semibold">{m.renewalsTitle}</p>
              <ul className="space-y-1.5">
                {m.renewals.map((r) => (
                  <li key={r.name} className="flex items-center gap-2 text-xs">
                    <span className={cn("size-2 rounded-full", toneDot[r.tone])} />
                    <span className="min-w-0 flex-1 truncate">
                      {r.name} <span className="text-muted">· {r.detail}</span>
                    </span>
                    <span className="rounded-full border border-border-strong px-2 py-0.5 text-[0.65rem]">
                      {m.renewalAction}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Progress */}
            <div
              data-hotspot="progress"
              className="rounded-xl border border-border bg-surface-2 p-3"
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold">{m.progressTitle}</span>
                <span className="text-primary-ink">
                  {m.progress.at(-1)} {m.progressUnit}
                </span>
              </div>
              <svg viewBox="0 0 200 60" className="h-16 w-full" preserveAspectRatio="none">
                <polyline
                  points={points}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
