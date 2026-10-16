/** Pure derivations over `GymData` (statuses, joins, totals). Safe to keep when the API lands. */
import { addDays, daysBetween, monthOf } from "@/lib/gym/dates";
import type {
  Client,
  ClientStatus,
  GymData,
  Membership,
  Payment,
  Plan,
  Trainer,
} from "@/lib/gym/types";

/** A membership counts as "due" when it ends within this many days. */
export const DUE_WINDOW_DAYS = 7;

export function membershipStatus(membership: Pick<Membership, "endDate">, today: string) {
  const left = daysBetween(today, membership.endDate);
  if (left < 0) return "expired" as const;
  if (left <= DUE_WINDOW_DAYS) return "due" as const;
  return "active" as const;
}

/** The membership that ends last — the one that decides a client's status. */
export function currentMembership(memberships: Membership[], clientId: string) {
  return memberships
    .filter((m) => m.clientId === clientId)
    .reduce<Membership | undefined>(
      (latest, m) => (!latest || m.endDate > latest.endDate ? m : latest),
      undefined,
    );
}

export type ClientRow = Client & {
  membership: Membership | undefined;
  plan: Plan | undefined;
  trainer: Trainer | undefined;
  status: ClientStatus;
};

export function buildClientRows(data: GymData, today: string): ClientRow[] {
  return data.clients.map((client) => {
    const membership = currentMembership(data.memberships, client.id);
    return {
      ...client,
      membership,
      plan: data.plans.find((p) => p.id === membership?.planId),
      trainer: data.trainers.find((t) => t.id === client.trainerId),
      status: membership ? membershipStatus(membership, today) : "none",
    };
  });
}

export const isActiveStatus = (status: ClientStatus) => status === "active" || status === "due";

export const paidPayments = (payments: Payment[]) => payments.filter((p) => p.status === "paid");
export const pendingPayments = (payments: Payment[]) =>
  payments.filter((p) => p.status === "pending");
export const sumAmount = (payments: Payment[]) => payments.reduce((sum, p) => sum + p.amount, 0);

/** Paid revenue grouped by "YYYY-MM". */
export function revenueByMonth(payments: Payment[], months: string[]) {
  const paid = paidPayments(payments);
  return months.map((month) => ({
    month,
    amount: sumAmount(paid.filter((p) => monthOf(p.date) === month)),
  }));
}

/** Clients whose current membership ends between today and `days` days from now, soonest first. */
export function upcomingRenewals(rows: ClientRow[], today: string, days = 14) {
  const limit = addDays(today, days);
  return rows
    .filter((r) => r.membership && r.membership.endDate >= today && r.membership.endDate <= limit)
    .sort((a, b) => a.membership!.endDate.localeCompare(b.membership!.endDate));
}
