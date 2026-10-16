/**
 * Shape of the gym records behind the Clients, Memberships, Trainers, Attendance, Payments and
 * Reports pages. This is the CONTRACT between the UI and the future backend: the API's resources
 * should match these types.
 *
 * Conventions (JSON-friendly, so the API can return them as-is):
 *  - money: whole rupees as numbers (formatting happens in the UI)
 *  - dates: "YYYY-MM-DD" strings; timestamps: full ISO strings
 *  - foreign keys are string ids (`clientId`, `planId`, `trainerId`, …)
 */
import type { MemberStatus } from "@/lib/dashboard/types";

export type Gender = "male" | "female" | "other";
export type PaymentMethod = "cash" | "upi" | "card" | "bank";
export type PaymentStatus = "paid" | "pending";

/** Derived, never stored: a client with no membership yet is "none". */
export type ClientStatus = MemberStatus | "none";

export type Trainer = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  joinedOn: string;
};

export type Plan = {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: Gender;
  joinedOn: string;
  trainerId: string | null;
};

export type Membership = {
  id: string;
  clientId: string;
  planId: string;
  startDate: string;
  /** Last day the membership is valid (inclusive). */
  endDate: string;
  /** Price charged for this membership. */
  amount: number;
};

export type AttendanceRecord = {
  id: string;
  clientId: string;
  checkedInAt: string;
};

export type Payment = {
  id: string;
  clientId: string;
  membershipId: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  /** Date received (paid) or date due (pending). */
  date: string;
  note: string;
};

export type GymData = {
  plans: Plan[];
  trainers: Trainer[];
  clients: Client[];
  memberships: Membership[];
  attendance: AttendanceRecord[];
  payments: Payment[];
};

export const EMPTY_GYM_DATA: GymData = {
  plans: [],
  trainers: [],
  clients: [],
  memberships: [],
  attendance: [],
  payments: [],
};
