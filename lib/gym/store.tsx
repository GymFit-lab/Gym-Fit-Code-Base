"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  checkInRecord,
  createClientRecord,
  createMembershipRecord,
  createPaymentRecord,
  createPlanRecord,
  createTrainerRecord,
  fetchGymData,
  markPaymentPaidRecord,
} from "@/app/actions/gym";
import { addDays, addMonths, dateOf, todayISO } from "@/lib/gym/dates";
import { loadGymData, resetGymData, saveGymData } from "@/lib/gym/data-source";
import type {
  Client,
  GymData,
  Membership,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Plan,
  Trainer,
} from "@/lib/gym/types";
import { EMPTY_GYM_DATA } from "@/lib/gym/types";

/**
 * Client-side store for every gym page. Pages read `data` and call the actions below; they never
 * touch storage or the network. Each action updates local state straight away; when `remote` is
 * on (AUTH_MODE=fitva) it also saves to fitva_db and then swaps in the reloaded data, so ids and
 * derived values come from the database. The signatures are the contract the UI depends on.
 */
export type NewClient = Omit<Client, "id" | "joinedOn">;
export type NewTrainer = Omit<Trainer, "id" | "joinedOn">;
export type NewPlan = Omit<Plan, "id">;
export type NewMembership = {
  clientId: string;
  planId: string;
  startDate: string;
  paymentStatus: PaymentStatus;
  method: PaymentMethod;
};
export type NewPayment = Omit<Payment, "id" | "membershipId">;

type GymStore = {
  /** False until the first load finishes — render a loading state, not empty tables. */
  ready: boolean;
  /** True while the data is local dummy data (shows the demo banner). */
  isDemo: boolean;
  data: GymData;
  addClient: (input: NewClient) => Client;
  addTrainer: (input: NewTrainer) => Trainer;
  addPlan: (input: NewPlan) => Plan;
  addMembership: (input: NewMembership) => Membership | null;
  addPayment: (input: NewPayment) => Payment;
  markPaymentPaid: (paymentId: string) => void;
  /** Returns "duplicate" if the client already checked in today. */
  checkIn: (clientId: string) => "ok" | "duplicate";
  resetDemo: () => Promise<void>;
};

const GymContext = createContext<GymStore | null>(null);

const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export function GymDataProvider({
  children,
  remote = false,
}: {
  children: ReactNode;
  /** Load and save through fitva_db (AUTH_MODE=fitva) instead of local dummy data. */
  remote?: boolean;
}) {
  const [data, setData] = useState<GymData>(EMPTY_GYM_DATA);
  const [ready, setReady] = useState(false);
  // Only the newest server response may replace the data (writes can finish out of order).
  const latestRequest = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void loadGymData(remote).then((loaded) => {
      if (cancelled) return;
      setData(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [remote]);

  useEffect(() => {
    if (ready) saveGymData(data, remote);
  }, [data, ready, remote]);

  /** Remote mode: run the write, then replace local state with what the database returns. */
  const sync = useCallback(
    (request: () => Promise<GymData>) => {
      if (!remote) return;
      const id = ++latestRequest.current;
      const apply = (fresh: GymData) => {
        if (id === latestRequest.current) setData(fresh);
      };
      request()
        .then(apply)
        .catch((error: unknown) => {
          console.error("[gym] saving to the database failed", error);
          // Drop the optimistic change by reloading what the database actually has.
          void fetchGymData().then(apply, () => {});
        });
    },
    [remote],
  );

  const addClient = useCallback(
    (input: NewClient) => {
      const client: Client = { ...input, id: newId("client"), joinedOn: todayISO() };
      setData((d) => ({ ...d, clients: [client, ...d.clients] }));
      sync(() => createClientRecord({ ...input, trainerId: input.trainerId ?? "" }));
      return client;
    },
    [sync],
  );

  const addTrainer = useCallback(
    (input: NewTrainer) => {
      const trainer: Trainer = { ...input, id: newId("trainer"), joinedOn: todayISO() };
      setData((d) => ({ ...d, trainers: [...d.trainers, trainer] }));
      sync(() => createTrainerRecord(input));
      return trainer;
    },
    [sync],
  );

  const addPlan = useCallback(
    (input: NewPlan) => {
      const plan: Plan = { ...input, id: newId("plan") };
      setData((d) => ({ ...d, plans: [...d.plans, plan] }));
      sync(() => createPlanRecord(input));
      return plan;
    },
    [sync],
  );

  const addMembership = useCallback(
    (input: NewMembership) => {
      const plan = data.plans.find((p) => p.id === input.planId);
      if (!plan) return null;

      const membership: Membership = {
        id: newId("membership"),
        clientId: input.clientId,
        planId: plan.id,
        startDate: input.startDate,
        endDate: addDays(addMonths(input.startDate, plan.durationMonths), -1),
        amount: plan.price,
      };
      const payment: Payment = {
        id: newId("payment"),
        clientId: input.clientId,
        membershipId: membership.id,
        amount: plan.price,
        method: input.method,
        status: input.paymentStatus,
        date: input.startDate,
        note: plan.name,
      };
      setData((d) => ({
        ...d,
        memberships: [membership, ...d.memberships],
        payments: [payment, ...d.payments],
      }));
      sync(() => createMembershipRecord(input));
      return membership;
    },
    [data.plans, sync],
  );

  const addPayment = useCallback(
    (input: NewPayment) => {
      const payment: Payment = { ...input, id: newId("payment"), membershipId: null };
      setData((d) => ({ ...d, payments: [payment, ...d.payments] }));
      sync(() => createPaymentRecord(input));
      return payment;
    },
    [sync],
  );

  const markPaymentPaid = useCallback(
    (paymentId: string) => {
      setData((d) => ({
        ...d,
        payments: d.payments.map((p) =>
          p.id === paymentId ? { ...p, status: "paid", date: todayISO() } : p,
        ),
      }));
      sync(() => markPaymentPaidRecord(paymentId));
    },
    [sync],
  );

  const checkIn = useCallback(
    (clientId: string) => {
      const today = todayISO();
      if (data.attendance.some((a) => a.clientId === clientId && dateOf(a.checkedInAt) === today)) {
        return "duplicate" as const;
      }
      const record = { id: newId("att"), clientId, checkedInAt: new Date().toISOString() };
      setData((d) => ({ ...d, attendance: [record, ...d.attendance] }));
      sync(() => checkInRecord(clientId));
      return "ok" as const;
    },
    [data.attendance, sync],
  );

  const resetDemo = useCallback(async () => {
    setReady(false);
    setData(await resetGymData(remote));
    setReady(true);
  }, [remote]);

  const value = useMemo<GymStore>(
    () => ({
      ready,
      isDemo: !remote,
      data,
      addClient,
      addTrainer,
      addPlan,
      addMembership,
      addPayment,
      markPaymentPaid,
      checkIn,
      resetDemo,
    }),
    [
      ready,
      remote,
      data,
      addClient,
      addTrainer,
      addPlan,
      addMembership,
      addPayment,
      markPaymentPaid,
      checkIn,
      resetDemo,
    ],
  );

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  const store = useContext(GymContext);
  if (!store) throw new Error("useGym must be used inside <GymDataProvider>.");
  return store;
}
