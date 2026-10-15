/**
 * Copy for the owner dashboard (labels, headings, empty states).
 * This file holds WORDS only — the numbers come from lib/dashboard/get-dashboard-data.ts.
 * Templates use `{key}` tokens filled via `fill()` from lib/utils.
 */
import type { KpiId, MemberStatus } from "@/lib/dashboard/types";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon:
    "dashboard" | "clients" | "memberships" | "attendance" | "trainers" | "payments" | "reports";
  /** Not built yet — rendered disabled with a "Soon" badge. */
  soon: boolean;
};

export const dashboardContent = {
  metaTitle: "Dashboard",
  navLabel: "Dashboard",
  soonBadge: "Soon",
  nav: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", soon: false },
    { label: "Clients", href: "/dashboard/clients", icon: "clients", soon: true },
    { label: "Memberships", href: "/dashboard/memberships", icon: "memberships", soon: true },
    { label: "Attendance", href: "/dashboard/attendance", icon: "attendance", soon: true },
    { label: "Trainers", href: "/dashboard/trainers", icon: "trainers", soon: true },
    { label: "Payments", href: "/dashboard/payments", icon: "payments", soon: true },
    { label: "Reports", href: "/dashboard/reports", icon: "reports", soon: true },
  ] satisfies DashboardNavItem[],

  /** `{name}` is the user's first name. */
  greeting: "Welcome back, {name}",
  /** `{time}` is when the data was generated. */
  updatedAt: "Updated {time}",

  demoBanner: {
    title: "Demo data",
    body: "These numbers are sample data. They’ll be replaced by your gym’s live data once the backend is connected.",
  },

  kpis: {
    activeMembers: { label: "Active members", comparison: "vs last month" },
    revenueThisMonth: { label: "Revenue this month", comparison: "vs last month" },
    checkInsToday: { label: "Check-ins today", comparison: "vs 30-day average" },
    renewalsDue: { label: "Renewals due (7 days)", comparison: "vs last week" },
  } satisfies Record<KpiId, { label: string; comparison: string }>,

  revenue: {
    title: "Revenue",
    description: "Collections per month, last 6 months",
  },
  attendance: {
    title: "Check-ins",
    description: "Members checked in per day, last 7 days",
  },
  membersByPlan: {
    title: "Members by plan",
    description: "Active memberships per plan",
  },
  renewals: {
    title: "Upcoming renewals",
    description: "Memberships expiring in the next 7 days",
    columns: { member: "Member", plan: "Plan", due: "Due", amount: "Amount", status: "Status" },
    remind: "Remind",
    remindSoon: "Reminders arrive with the backend",
    empty: "No renewals due this week.",
  },
  checkIns: {
    title: "Recent check-ins",
    description: "Latest arrivals at the front desk",
    noTrainer: "No trainer",
    empty: "No check-ins yet today.",
  },
  trainers: {
    title: "Trainer load",
    description: "Assigned clients and today’s sessions",
    /** `{count}` = number of clients. */
    clients: "{count} clients",
    /** `{count}` = number of sessions. */
    sessions: "{count} sessions today",
  },
  payments: {
    title: "Pending payments",
    description: "Overdue membership dues",
    totalLabel: "Total outstanding",
    /** `{days}` = days overdue. */
    overdue: "{days}d overdue",
    empty: "No pending payments.",
  },

  statusLabels: {
    active: "Active",
    due: "Due",
    overdue: "Overdue",
    expired: "Expired",
  } satisfies Record<MemberStatus, string>,

  /** Screen-reader table captions for the charts. */
  chartTable: {
    period: "Period",
    value: "Value",
  },
  /** Relative time for check-ins. */
  relative: {
    justNow: "just now",
    minutes: "{n} min ago",
    hours: "{n} h ago",
  },
};
