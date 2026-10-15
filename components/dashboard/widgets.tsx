import { BellRing, Info } from "lucide-react";

import { EmptyState, Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { dashboardContent as copy } from "@/content/dashboard";
import {
  formatNumber,
  formatRelative,
  formatShortDate,
  formatTime,
  formatValue,
} from "@/lib/dashboard/format";
import type { DashboardData, MemberStatus } from "@/lib/dashboard/types";
import { cn, fill, initials } from "@/lib/utils";

const statusStyles: Record<MemberStatus, string> = {
  active: "bg-primary/15 text-primary-ink",
  due: "bg-fg/10 text-fg",
  overdue: "bg-accent/10 text-accent-ink",
  expired: "bg-fg/5 text-muted",
};

function StatusPill({ status }: { status: MemberStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        statusStyles[status],
      )}
    >
      {copy.statusLabels[status]}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-xs font-bold"
    >
      {initials(name)}
    </span>
  );
}

/** Shown while the dashboard is fed by lib/dashboard/mock-data.ts. Remove with the mock data. */
export function DemoDataBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden="true" />
      <p>
        <strong className="font-semibold text-accent-ink">{copy.demoBanner.title}.</strong>{" "}
        <span className="text-fg">{copy.demoBanner.body}</span>
      </p>
    </div>
  );
}

/** Horizontal bars, one hue (magnitude, not identity), each directly labelled with its count. */
export function MembersByPlan({ data }: { data: DashboardData["membersByPlan"] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Panel title={copy.membersByPlan.title} description={copy.membersByPlan.description}>
      <ul className="grid gap-4">
        {data.map((row) => (
          <li key={row.plan}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{row.plan}</span>
              <span className="font-mono text-muted">
                <span className="font-semibold text-fg">{formatNumber(row.count)}</span>
                {total > 0 && ` · ${Math.round((row.count / total) * 100)}%`}
              </span>
            </div>
            <div aria-hidden="true" className="mt-2 h-2.5 overflow-hidden rounded-full bg-fg/5">
              <div
                className="h-full rounded-full bg-primary-ink"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function RenewalsTable({ data }: { data: DashboardData["renewals"] }) {
  const { renewals } = copy;

  return (
    <Panel title={renewals.title} description={renewals.description}>
      {data.length === 0 ? (
        <EmptyState>{renewals.empty}</EmptyState>
      ) : (
        <div className="-mx-5 overflow-x-auto md:-mx-6">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-wider text-muted uppercase">
                <th scope="col" className="px-5 py-3 font-semibold md:px-6">
                  {renewals.columns.member}
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {renewals.columns.plan}
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {renewals.columns.due}
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  {renewals.columns.amount}
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {renewals.columns.status}
                </th>
                <th scope="col" className="px-5 py-3 md:px-6">
                  <span className="sr-only">{renewals.remind}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <th scope="row" className="px-5 py-3 font-medium md:px-6">
                    <span className="flex items-center gap-3">
                      <Avatar name={row.memberName} />
                      {row.memberName}
                    </span>
                  </th>
                  <td className="px-3 py-3 text-muted">{row.plan}</td>
                  <td className="px-3 py-3 font-mono">{formatShortDate(row.dueDate)}</td>
                  <td className="px-3 py-3 text-right font-mono">
                    {formatValue(row.amount, "currency")}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-5 py-3 text-right md:px-6">
                    {/* TODO(api): wire to the reminder endpoint once it exists. */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title={renewals.remindSoon}
                      aria-label={`${renewals.remind} ${row.memberName}`}
                    >
                      <BellRing />
                      {renewals.remind}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function RecentCheckIns({
  data,
  now,
}: {
  data: DashboardData["recentCheckIns"];
  /** Reference time for "x min ago" (the data's generatedAt). */
  now: number;
}) {
  const { checkIns } = copy;

  return (
    <Panel title={checkIns.title} description={checkIns.description}>
      {data.length === 0 ? (
        <EmptyState>{checkIns.empty}</EmptyState>
      ) : (
        <ul className="grid gap-1">
          {data.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-2xl px-2 py-2">
              <Avatar name={row.memberName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.memberName}</p>
                <p className="truncate text-xs text-muted">
                  {row.trainerName ?? checkIns.noTrainer}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{formatTime(row.checkedInAt)}</p>
                <p className="text-xs text-muted">{formatRelative(row.checkedInAt, now)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function TrainerLoadList({ data }: { data: DashboardData["trainers"] }) {
  const { trainers } = copy;
  const max = Math.max(1, ...data.map((t) => t.activeClients));

  return (
    <Panel title={trainers.title} description={trainers.description}>
      <ul className="grid gap-4">
        {data.map((trainer) => (
          <li key={trainer.id} className="flex items-center gap-3">
            <Avatar name={trainer.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-semibold">{trainer.name}</p>
                <p className="shrink-0 font-mono text-xs text-muted">
                  {fill(trainers.clients, { count: trainer.activeClients })}
                </p>
              </div>
              <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-fg/5">
                <div
                  className="h-full rounded-full bg-primary-ink"
                  style={{ width: `${(trainer.activeClients / max) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                {trainer.specialty} · {fill(trainers.sessions, { count: trainer.sessionsToday })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function PendingPayments({ data }: { data: DashboardData["pendingPayments"] }) {
  const { payments } = copy;

  return (
    <Panel title={payments.title} description={payments.description}>
      <p className="text-sm text-muted">{payments.totalLabel}</p>
      <p className="mt-1 font-mono text-3xl font-bold">{formatValue(data.total, "currency")}</p>
      {data.items.length === 0 ? (
        <div className="mt-5">
          <EmptyState>{payments.empty}</EmptyState>
        </div>
      ) : (
        <ul className="mt-5 grid gap-2">
          {data.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-bg/50 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.memberName}</p>
                <p className="text-xs text-accent-ink">
                  {fill(payments.overdue, { days: item.daysOverdue })}
                </p>
              </div>
              <p className="font-mono text-sm font-semibold">
                {formatValue(item.amount, "currency")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
