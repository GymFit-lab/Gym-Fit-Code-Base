/**
 * Shape of the data the owner dashboard renders. This is the CONTRACT between the UI and
 * the backend: the future API's GET /dashboard response should match `DashboardData`.
 *
 * Conventions (JSON-friendly, so the API can return this as-is):
 *  - money: whole rupees as numbers (formatting happens in the UI)
 *  - dates: ISO strings — "YYYY-MM" for months, "YYYY-MM-DD" for days, full ISO for timestamps
 */

export type KpiId = "activeMembers" | "revenueThisMonth" | "checkInsToday" | "renewalsDue";

export type Kpi = {
  id: KpiId;
  value: number;
  /** Comparison value for the delta (last month / 30-day average / last week). */
  previous: number;
  format: "number" | "currency";
};

export type MemberStatus = "active" | "due" | "overdue" | "expired";

export type Renewal = {
  id: string;
  memberName: string;
  plan: string;
  dueDate: string;
  amount: number;
  status: Extract<MemberStatus, "due" | "overdue">;
};

export type CheckIn = {
  id: string;
  memberName: string;
  checkedInAt: string;
  trainerName: string | null;
};

export type TrainerLoad = {
  id: string;
  name: string;
  specialty: string;
  activeClients: number;
  sessionsToday: number;
};

export type PendingPayment = {
  id: string;
  memberName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
};

export type DashboardData = {
  gym: { name: string; branch: string };
  /** When the numbers were computed (ISO timestamp). */
  generatedAt: string;
  kpis: Kpi[];
  revenueByMonth: { month: string; amount: number }[];
  checkInsByDay: { date: string; count: number }[];
  membersByPlan: { plan: string; count: number }[];
  renewals: Renewal[];
  recentCheckIns: CheckIn[];
  trainers: TrainerLoad[];
  pendingPayments: { total: number; items: PendingPayment[] };
};

/**
 * Where dashboard data comes from. "mock" = local dummy data (lib/dashboard/mock-data.ts),
 * "api" = GET {API_BASE_URL}/dashboard, "db" = fitva_db stored functions (AUTH_MODE=fitva).
 */
export type DashboardDataSource = "mock" | "api" | "db";
