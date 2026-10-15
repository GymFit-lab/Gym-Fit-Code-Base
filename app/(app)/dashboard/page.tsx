import type { Metadata } from "next";

import { BarChart } from "@/components/dashboard/charts/bar-chart";
import { LineChart } from "@/components/dashboard/charts/line-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Panel } from "@/components/dashboard/panel";
import {
  DemoDataBanner,
  MembersByPlan,
  PendingPayments,
  RecentCheckIns,
  RenewalsTable,
  TrainerLoadList,
} from "@/components/dashboard/widgets";
import { dashboardContent as copy } from "@/content/dashboard";
import { dashboardDataSource, getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { formatMonth, formatTime, formatWeekday } from "@/lib/dashboard/format";
import { getCurrentUser } from "@/lib/session";
import { fill } from "@/lib/utils";

export const metadata: Metadata = { title: copy.metaTitle };

/** Owner dashboard. All numbers come from getDashboardData() — never import mock data here. */
export default async function DashboardPage() {
  const [user, data] = await Promise.all([getCurrentUser(), getDashboardData()]);
  const firstName = user?.name.split(" ")[0] ?? "";
  const generatedAt = new Date(data.generatedAt).getTime();

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            {data.gym.name} · {data.gym.branch}
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-wide uppercase md:text-6xl">
            {fill(copy.greeting, { name: firstName })}
          </h1>
        </div>
        <p className="font-mono text-xs text-muted">
          {fill(copy.updatedAt, { time: formatTime(data.generatedAt) })}
        </p>
      </header>

      {dashboardDataSource === "mock" && <DemoDataBanner />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
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
            points={data.revenueByMonth.map((m) => ({
              label: formatMonth(m.month),
              value: m.amount,
            }))}
          />
        </Panel>
        <MembersByPlan data={data.membersByPlan} />
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
            points={data.checkInsByDay.map((d) => ({
              label: formatWeekday(d.date),
              value: d.count,
            }))}
          />
        </Panel>
        <RecentCheckIns data={data.recentCheckIns} now={generatedAt} />
      </div>

      <RenewalsTable data={data.renewals} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TrainerLoadList data={data.trainers} />
        <PendingPayments data={data.pendingPayments} />
      </div>
    </div>
  );
}
