/**
 * ⚠️ DUMMY DATA — delete this whole file once the gym API is live.
 *
 * Only lib/gym/data-source.ts imports it. Every name and number is fictional. Dates are generated
 * relative to "today" so the demo always looks current; the generator is deterministic (no
 * Math.random) so the numbers are stable between resets.
 */
import { addDays, addMonths, dateOf, lastDays, todayISO } from "@/lib/gym/dates";
import type {
  AttendanceRecord,
  Client,
  GymData,
  Membership,
  Payment,
  PaymentMethod,
  Plan,
  Trainer,
} from "@/lib/gym/types";

const plans: Plan[] = [
  { id: "plan-monthly", name: "Monthly", durationMonths: 1, price: 1500 },
  { id: "plan-quarterly", name: "Quarterly", durationMonths: 3, price: 4000 },
  { id: "plan-half-yearly", name: "Half-yearly", durationMonths: 6, price: 7200 },
  { id: "plan-annual", name: "Annual", durationMonths: 12, price: 12000 },
];

const trainers: Trainer[] = [
  {
    id: "trainer-1",
    name: "Rohan Deshmukh",
    specialty: "Strength & conditioning",
    phone: "9820011001",
    email: "rohan@demo-gym.test",
    joinedOn: "2023-04-10",
  },
  {
    id: "trainer-2",
    name: "Sneha Kulkarni",
    specialty: "Yoga & mobility",
    phone: "9820011002",
    email: "sneha@demo-gym.test",
    joinedOn: "2023-09-01",
  },
  {
    id: "trainer-3",
    name: "Imran Sheikh",
    specialty: "Weight loss & HIIT",
    phone: "9820011003",
    email: "imran@demo-gym.test",
    joinedOn: "2024-02-19",
  },
  {
    id: "trainer-4",
    name: "Pooja Nair",
    specialty: "CrossFit",
    phone: "9820011004",
    email: "pooja@demo-gym.test",
    joinedOn: "2025-01-06",
  },
];

/** [name, gender, plan index, membership end offset in days from today, trainer index | -1] */
const people: [string, Client["gender"], number, number, number][] = [
  ["Aarav Mehta", "male", 1, 45, 0],
  ["Diya Sharma", "female", 0, 20, 1],
  ["Kabir Singh", "male", 0, 5, 2],
  ["Meera Pillai", "female", 0, 2, 1],
  ["Vihaan Patel", "male", 2, -10, 0],
  ["Ananya Iyer", "female", 3, 90, 3],
  ["Arjun Reddy", "male", 3, 200, 0],
  ["Ishita Gupta", "female", 1, 12, 2],
  ["Rahul Verma", "male", 0, 3, -1],
  ["Saanvi Joshi", "female", 2, 150, 1],
  ["Aditya Rao", "male", 1, -3, 3],
  ["Kavya Menon", "female", 2, 60, 2],
  ["Nikhil Bose", "male", 0, 6, 0],
  ["Riya Kapoor", "female", 1, 30, -1],
  ["Siddharth Jain", "male", 3, 300, 3],
  ["Tanvi Shah", "female", 0, -25, 1],
];

/** Index of clients whose latest payment is still pending. */
const PENDING_CLIENTS = new Set([3, 10, 15]);
const METHODS: PaymentMethod[] = ["upi", "cash", "card", "upi", "bank"];

/** Cheap deterministic hash → 0..n-1, replaces Math.random. */
const pick = (seed: number, n: number) => Math.abs(Math.imul(seed + 1, 2654435761) >>> 0) % n;

export function createMockGymData(): GymData {
  const today = todayISO();
  const clients: Client[] = [];
  const memberships: Membership[] = [];
  const payments: Payment[] = [];

  people.forEach(([name, gender, planIndex, endOffset, trainerIndex], i) => {
    const plan = plans[planIndex]!;
    const id = `client-${i + 1}`;

    // Build the membership chain backwards from the latest one (up to 6 renewals, ~14 months).
    let endDate = addDays(today, endOffset);
    let startDate = addDays(addMonths(endDate, -plan.durationMonths), 1);
    const earliestStart = addDays(today, -420);
    let joinedOn = startDate;

    for (let n = 0; n < 6 && startDate >= earliestStart; n++) {
      const membershipId = `membership-${i + 1}-${n + 1}`;
      memberships.push({
        id: membershipId,
        clientId: id,
        planId: plan.id,
        startDate,
        endDate,
        amount: plan.price,
      });
      const isLatest = n === 0;
      payments.push({
        id: `payment-${i + 1}-${n + 1}`,
        clientId: id,
        membershipId,
        amount: plan.price,
        method: METHODS[pick(i * 7 + n, METHODS.length)]!,
        status: isLatest && PENDING_CLIENTS.has(i) ? "pending" : "paid",
        date: isLatest && PENDING_CLIENTS.has(i) ? addDays(startDate, 3) : startDate,
        note: isLatest ? "" : "Renewal",
      });
      joinedOn = startDate;
      endDate = addDays(startDate, -1);
      startDate = addDays(addMonths(endDate, -plan.durationMonths), 1);
    }

    clients.push({
      id,
      name,
      gender,
      phone: `98${String(70000000 + i * 1234567).slice(0, 8)}`,
      email: `${name.split(" ")[0]!.toLowerCase()}@example.test`,
      joinedOn,
      trainerId: trainerIndex >= 0 ? trainers[trainerIndex]!.id : null,
    });
  });

  return {
    plans,
    trainers,
    clients,
    memberships,
    payments,
    attendance: buildAttendance(clients, memberships, today),
  };
}

/** Roughly 3 visits in 5 days for every client whose membership covered that day. */
function buildAttendance(clients: Client[], memberships: Membership[], today: string) {
  const attendance: AttendanceRecord[] = [];
  const now = Date.now();

  lastDays(21, today).forEach((date, d) => {
    clients.forEach((client, c) => {
      const covered = memberships.some(
        (m) => m.clientId === client.id && m.startDate <= date && m.endDate >= date,
      );
      if (!covered || pick(d * 31 + c * 17, 5) >= 3) return;

      const hour = 6 + pick(d + c * 5, 14); // 06:00–19:59
      const minute = pick(d * 3 + c, 60);
      const at = new Date(
        `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`,
      );
      if (at.getTime() > now) return; // nothing in the future

      attendance.push({ id: `att-${d}-${c}`, clientId: client.id, checkedInAt: at.toISOString() });
    });
  });

  return attendance
    .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
    .filter((a) => dateOf(a.checkedInAt) <= today);
}
