"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";

import { BarChart } from "@/components/dashboard/charts/bar-chart";
import { LineChart } from "@/components/dashboard/charts/line-chart";
import { EmptyState, Panel } from "@/components/dashboard/panel";
import { MembersByPlan, TrainerLoadList } from "@/components/dashboard/widgets";
import { DemoBanner } from "@/components/gym/demo-banner";
import { LoadingState, PageHeader, Person, StatTile } from "@/components/gym/shared";
import { Button } from "@/components/ui/button";
import { gymContent } from "@/content/gym";
import { formatMonth, formatNumber, formatWeekday } from "@/lib/dashboard/format";
import {
  addDays,
  dateOf,
  daysBetween,
  lastDays,
  lastMonths,
  monthOf,
  todayISO,
} from "@/lib/gym/dates";
import { formatDayMonth, formatMoney } from "@/lib/gym/format";
import {
  buildClientRows,
  isActiveStatus,
  paidPayments,
  pendingPayments,
  revenueByMonth,
  sumAmount,
  upcomingRenewals,
} from "@/lib/gym/selectors";
import { useGym } from "@/lib/gym/store";
import type { GymData } from "@/lib/gym/types";
import { fill } from "@/lib/utils";

const copy = gymContent.reports;

/** Share of memberships that ended in the last 90 days and were followed by another within 30 days. */
function renewalRate(data: GymData, today: string) {
  const ended = data.memberships.filter(
    (m) => m.endDate < today && m.endDate >= addDays(today, -90),
  );
  if (ended.length === 0) return null;
  const renewed = ended.filter((m) =>
    data.memberships.some(
      (n) =>
        n.clientId === m.clientId && n.endDate > m.endDate && n.startDate <= addDays(m.endDate, 30),
    ),
  );
  return Math.round((renewed.length / ended.length) * 100);
}

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

function exportPaymentsCsv(data: GymData, today: string) {
  const names = new Map(data.clients.map((c) => [c.id, c.name]));
  const lines = [
    copy.csvHeaders,
    ...[...data.payments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((p) => [
        p.date,
        names.get(p.clientId) ?? "",
        gymContent.methods[p.method],
        gymContent.paymentStatuses[p.status],
        p.amount,
        p.note,
      ]),
  ].map((row) => row.map(csvCell).join(","));

  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fill(copy.csvFile, { date: today });
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsView() {
  const { ready, data } = useGym();

  const report = useMemo(() => {
    const today = todayISO();
    const rows = buildClientRows(data, today);
    const paid = paidPayments(data.payments);
    const month = monthOf(today);
    const yearAgo = addDays(today, -365);

    const methodTotals = Object.keys(gymContent.methods).map((method) => ({
      plan: gymContent.methods[method as keyof typeof gymContent.methods],
      count: sumAmount(paid.filter((p) => p.method === method && p.date >= yearAgo)),
    }));

    const checkInsPerDay = new Map<string, number>();
    for (const a of data.attendance) {
      const d = dateOf(a.checkedInAt);
      checkInsPerDay.set(d, (checkInsPerDay.get(d) ?? 0) + 1);
    }

    return {
      today,
      revenue: revenueByMonth(data.payments, lastMonths(6, today)),
      thisMonth: sumAmount(paid.filter((p) => monthOf(p.date) === month)),
      newClients: data.clients.filter((c) => monthOf(c.joinedOn) === month).length,
      outstanding: sumAmount(pendingPayments(data.payments)),
      retention: renewalRate(data, today),
      checkIns: lastDays(14, today).map((d) => ({ date: d, count: checkInsPerDay.get(d) ?? 0 })),
      byPlan: data.plans.map((p) => ({
        plan: p.name,
        count: rows.filter((r) => r.plan?.id === p.id && isActiveStatus(r.status)).length,
      })),
      methods: methodTotals.filter((m) => m.count > 0),
      trainers: data.trainers.map((t) => {
        const ids = new Set(data.clients.filter((c) => c.trainerId === t.id).map((c) => c.id));
        return {
          id: t.id,
          name: t.name,
          specialty: t.specialty,
          activeClients: ids.size,
          sessionsToday: data.attendance.filter(
            (a) => ids.has(a.clientId) && dateOf(a.checkedInAt) === today,
          ).length,
        };
      }),
      renewals: upcomingRenewals(rows, today),
    };
  }, [data]);

  if (!ready) return <LoadingState />;

  const methodTotal = report.methods.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportPaymentsCsv(data, report.today)}
            disabled={data.payments.length === 0}
          >
            <Download aria-hidden="true" />
            {copy.export}
          </Button>
        }
      />
      <DemoBanner />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={copy.kpis.revenue} value={formatMoney(report.thisMonth)} />
        <StatTile label={copy.kpis.newClients} value={formatNumber(report.newClients)} />
        <StatTile
          label={copy.kpis.retention}
          value={report.retention === null ? copy.retentionNone : `${report.retention}%`}
          hint={copy.retentionHint}
        />
        <StatTile label={copy.kpis.outstanding} value={formatMoney(report.outstanding)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title={copy.revenue.title}
          description={copy.revenue.description}
          className="xl:col-span-2"
        >
          <LineChart
            title={copy.revenue.description}
            format="currency"
            points={report.revenue.map((m) => ({ label: formatMonth(m.month), value: m.amount }))}
          />
        </Panel>
        <MembersByPlan data={report.byPlan} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title={copy.attendance.title}
          description={copy.attendance.description}
          className="xl:col-span-2"
        >
          <BarChart
            title={copy.attendance.description}
            format="number"
            points={report.checkIns.map((d) => ({ label: formatWeekday(d.date), value: d.count }))}
          />
        </Panel>
        <Panel title={copy.methods.title} description={copy.methods.description}>
          {report.methods.length === 0 ? (
            <EmptyState>{copy.methods.empty}</EmptyState>
          ) : (
            <ul className="grid gap-4">
              {report.methods.map((m) => (
                <li key={m.plan}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{m.plan}</span>
                    <span className="font-mono text-muted">
                      <span className="font-semibold text-fg">{formatMoney(m.count)}</span>
                      {` · ${Math.round((m.count / methodTotal) * 100)}%`}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-fg/5"
                  >
                    <div
                      className="h-full rounded-full bg-primary-ink"
                      style={{ width: `${(m.count / methodTotal) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrainerLoadList data={report.trainers} />
        <Panel title={copy.renewals.title} description={copy.renewals.description}>
          {report.renewals.length === 0 ? (
            <EmptyState>{copy.renewals.empty}</EmptyState>
          ) : (
            <ul className="grid gap-1">
              {report.renewals.map((r) => {
                const left = daysBetween(report.today, r.membership!.endDate);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-2 py-2">
                    <Person name={r.name} subtitle={r.plan?.name} />
                    <span className="text-right font-mono text-xs">
                      <span className="block text-sm">{formatDayMonth(r.membership!.endDate)}</span>
                      <span className="text-muted">
                        {left === 0
                          ? copy.renewals.today
                          : fill(copy.renewals.left, { days: left })}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
