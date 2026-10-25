/**
 * Builds `GymData` (lib/gym/types.ts, the store's bootstrap) from fitva_db for one gym.
 * List functions are paged; this walks every page so the client-side selectors see everything.
 */
import { callFn } from "@/lib/fitva/db";
import type {
  AttendanceRecord,
  Client,
  Gender,
  GymData,
  Membership,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Plan,
  Trainer,
} from "@/lib/gym/types";

const PAGE_SIZE = 500;
/** The gym pages look back at most 30 days; keep some margin for the reports. */
const ATTENDANCE_DAYS = 90;

type Paged = { total_count: number };

/** Calls a `usp_*_get_paged(gym, search, page, size)` function until every row is loaded. */
async function allPages<Row extends Paged>(name: `usp_${string}_get_paged`, gymId: string) {
  const rows: Row[] = [];
  for (let page = 1; ; page++) {
    const batch = await callFn<Row>(name, [gymId, null, page, PAGE_SIZE]);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE || rows.length >= (batch[0]?.total_count ?? 0)) return rows;
  }
}

type PlanRow = { id: string; name: string; duration_months: number; price: number };
type TrainerRow = Paged & {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string | null;
  joined_on: string;
};
type ClientRow = Paged & {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: Gender;
  joined_on: string;
  trainer_id: string | null;
};
type MembershipRow = Paged & {
  id: string;
  client_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  amount: number;
};
type AttendanceRow = { id: string; client_id: string; checked_in_at: string };
type PaymentRow = Paged & {
  id: string;
  client_id: string;
  membership_id: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  payment_date: string;
  note: string;
};

export async function loadGymDataFromDb(gymId: string): Promise<GymData> {
  const [plans, trainers, clients, memberships, attendance, payments] = await Promise.all([
    callFn<PlanRow>("usp_plan_get_list", [gymId]),
    allPages<TrainerRow>("usp_trainer_get_paged", gymId),
    allPages<ClientRow>("usp_client_get_paged", gymId),
    allPages<MembershipRow>("usp_membership_get_paged", gymId),
    callFn<AttendanceRow>("usp_attendance_get_list", [gymId, ATTENDANCE_DAYS]),
    allPages<PaymentRow>("usp_payment_get_paged", gymId),
  ]);

  return {
    plans: plans.map((p): Plan => ({
      id: p.id,
      name: p.name,
      durationMonths: p.duration_months,
      price: p.price,
    })),
    trainers: trainers.map((t): Trainer => ({
      id: t.id,
      name: t.name,
      specialty: t.specialty,
      phone: t.phone,
      email: t.email ?? "",
      joinedOn: t.joined_on,
    })),
    clients: clients.map((c): Client => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      gender: c.gender,
      joinedOn: c.joined_on,
      trainerId: c.trainer_id,
    })),
    memberships: memberships.map((m): Membership => ({
      id: m.id,
      clientId: m.client_id,
      planId: m.plan_id,
      startDate: m.start_date,
      endDate: m.end_date,
      amount: m.amount,
    })),
    attendance: attendance.map((a): AttendanceRecord => ({
      id: a.id,
      clientId: a.client_id,
      checkedInAt: a.checked_in_at,
    })),
    payments: payments.map((p): Payment => ({
      id: p.id,
      clientId: p.client_id,
      membershipId: p.membership_id,
      amount: p.amount,
      method: p.method,
      status: p.status,
      date: p.payment_date,
      note: p.note,
    })),
  };
}
