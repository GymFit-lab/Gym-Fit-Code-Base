/** Builds `DashboardData` (lib/dashboard/types.ts) from fitva_db's usp_dashboard_* functions. */
import type { DashboardData, Kpi, KpiId, MemberStatus } from "@/lib/dashboard/types";
import { callFn } from "@/lib/fitva/db";

type GymRow = { name: string; branch: string };
type KpiRow = { id: KpiId; value: number; previous: number; format: Kpi["format"] };
type RevenueRow = { revenue_month: string; amount: number };
type DailyRow = { check_in_date: string; check_in_count: number };
type PlanRow = { plan_name: string; member_count: number };
type RenewalRow = {
  id: string;
  member_name: string;
  plan: string;
  due_date: string;
  amount: number;
  status: Extract<MemberStatus, "due" | "overdue">;
};
type CheckInRow = {
  id: string;
  member_name: string;
  checked_in_at: string;
  trainer_name: string | null;
};
type TrainerRow = {
  id: string;
  name: string;
  specialty: string;
  active_clients: number;
  sessions_today: number;
};
type PendingRow = {
  id: string;
  member_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  total_pending: number;
};

export async function loadDashboardFromDb(gymId: string): Promise<DashboardData> {
  const [gym, kpis, revenue, daily, plans, renewals, checkIns, trainers, pending] =
    await Promise.all([
      callFn<GymRow>("usp_gym_get", [gymId]),
      callFn<KpiRow>("usp_dashboard_get_kpis", [gymId]),
      callFn<RevenueRow>("usp_dashboard_get_revenue_by_month", [gymId, 6]),
      callFn<DailyRow>("usp_attendance_get_daily", [gymId, 7]),
      callFn<PlanRow>("usp_dashboard_get_members_by_plan", [gymId]),
      callFn<RenewalRow>("usp_dashboard_get_renewals", [gymId]),
      callFn<CheckInRow>("usp_dashboard_get_recent_checkins", [gymId, 8]),
      callFn<TrainerRow>("usp_dashboard_get_trainer_load", [gymId]),
      callFn<PendingRow>("usp_dashboard_get_pending_payments", [gymId, 5]),
    ]);

  return {
    gym: { name: gym[0]?.name ?? "", branch: gym[0]?.branch ?? "" },
    generatedAt: new Date().toISOString(),
    kpis: kpis.map((k) => ({ id: k.id, value: k.value, previous: k.previous, format: k.format })),
    revenueByMonth: revenue.map((r) => ({ month: r.revenue_month, amount: r.amount })),
    checkInsByDay: daily.map((d) => ({ date: d.check_in_date, count: d.check_in_count })),
    membersByPlan: plans.map((p) => ({ plan: p.plan_name, count: p.member_count })),
    renewals: renewals.map((r) => ({
      id: r.id,
      memberName: r.member_name,
      plan: r.plan,
      dueDate: r.due_date,
      amount: r.amount,
      status: r.status,
    })),
    recentCheckIns: checkIns.map((c) => ({
      id: c.id,
      memberName: c.member_name,
      checkedInAt: c.checked_in_at,
      trainerName: c.trainer_name,
    })),
    trainers: trainers.map((t) => ({
      id: t.id,
      name: t.name,
      specialty: t.specialty,
      activeClients: t.active_clients,
      sessionsToday: t.sessions_today,
    })),
    pendingPayments: {
      total: pending[0]?.total_pending ?? 0,
      items: pending.map((p) => ({
        id: p.id,
        memberName: p.member_name,
        amount: p.amount,
        dueDate: p.due_date,
        daysOverdue: p.days_overdue,
      })),
    },
  };
}
