/**
 * ⚠️ DUMMY DATA — delete this whole file once the dashboard API is live.
 *
 * Only lib/dashboard/get-dashboard-data.ts imports it. Every name and number is fictional.
 * Dates are generated relative to "today" so the demo always looks current.
 */
import type { DashboardData } from "@/lib/dashboard/types";

const DAY_MS = 24 * 60 * 60 * 1000;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const daysFromNow = (days: number) => isoDate(new Date(Date.now() + days * DAY_MS));

function monthsBack(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export function getMockDashboardData(): DashboardData {
  const months = monthsBack(6);
  const revenue = [148500, 162000, 157800, 171200, 184900, 196400];
  const checkIns = [74, 81, 69, 88, 92, 103, 58];

  return {
    gym: { name: "Demo Gym", branch: "Main Branch" },
    generatedAt: new Date().toISOString(),

    kpis: [
      { id: "activeMembers", value: 248, previous: 236, format: "number" },
      { id: "revenueThisMonth", value: 196400, previous: 184900, format: "currency" },
      { id: "checkInsToday", value: 86, previous: 78, format: "number" },
      { id: "renewalsDue", value: 12, previous: 9, format: "number" },
    ],

    revenueByMonth: months.map((month, i) => ({ month, amount: revenue[i] ?? 0 })),

    checkInsByDay: checkIns.map((count, i) => ({
      date: daysFromNow(i - (checkIns.length - 1)),
      count,
    })),

    membersByPlan: [
      { plan: "Monthly", count: 104 },
      { plan: "Quarterly", count: 68 },
      { plan: "Half-yearly", count: 41 },
      { plan: "Annual", count: 35 },
    ],

    renewals: [
      {
        id: "r1",
        memberName: "Meera Pillai",
        plan: "Monthly",
        dueDate: daysFromNow(-2),
        amount: 1500,
        status: "overdue",
      },
      {
        id: "r2",
        memberName: "Sana Iqbal",
        plan: "Monthly",
        dueDate: daysFromNow(1),
        amount: 1500,
        status: "due",
      },
      {
        id: "r3",
        memberName: "Ishaan Rao",
        plan: "Quarterly",
        dueDate: daysFromNow(3),
        amount: 4000,
        status: "due",
      },
      {
        id: "r4",
        memberName: "Kavya Menon",
        plan: "Half-yearly",
        dueDate: daysFromNow(5),
        amount: 7500,
        status: "due",
      },
      {
        id: "r5",
        memberName: "Arjun Malhotra",
        plan: "Annual",
        dueDate: daysFromNow(6),
        amount: 13500,
        status: "due",
      },
    ],

    recentCheckIns: [
      {
        id: "c1",
        memberName: "Aarav Mehta",
        checkedInAt: minutesAgo(4),
        trainerName: "Coach Neha",
      },
      {
        id: "c2",
        memberName: "Priya Kulkarni",
        checkedInAt: minutesAgo(11),
        trainerName: "Coach Vikram",
      },
      { id: "c3", memberName: "Rohan Das", checkedInAt: minutesAgo(19), trainerName: null },
      {
        id: "c4",
        memberName: "Neel Joshi",
        checkedInAt: minutesAgo(32),
        trainerName: "Coach Arjun",
      },
      {
        id: "c5",
        memberName: "Ananya Iyer",
        checkedInAt: minutesAgo(47),
        trainerName: "Coach Neha",
      },
    ],

    trainers: [
      { id: "t1", name: "Coach Neha", specialty: "Strength", activeClients: 24, sessionsToday: 7 },
      {
        id: "t2",
        name: "Coach Vikram",
        specialty: "Fat loss · HIIT",
        activeClients: 19,
        sessionsToday: 5,
      },
      { id: "t3", name: "Coach Arjun", specialty: "Mobility", activeClients: 12, sessionsToday: 3 },
      { id: "t4", name: "Coach Riya", specialty: "Yoga", activeClients: 16, sessionsToday: 4 },
    ],

    pendingPayments: {
      total: 18500,
      items: [
        {
          id: "p1",
          memberName: "Meera Pillai",
          amount: 1500,
          dueDate: daysFromNow(-2),
          daysOverdue: 2,
        },
        {
          id: "p2",
          memberName: "Dev Khanna",
          amount: 4000,
          dueDate: daysFromNow(-6),
          daysOverdue: 6,
        },
        {
          id: "p3",
          memberName: "Tara Bose",
          amount: 13000,
          dueDate: daysFromNow(-11),
          daysOverdue: 11,
        },
      ],
    },
  };
}
