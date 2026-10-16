"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
 * touch storage or the network. While the backend doesn't exist the actions update local state
 * (persisted by lib/gym/data-source.ts). When the API lands, change the bodies of the actions to
 * call it — the signatures are the contract the UI depends on.
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

export function GymDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GymData>(EMPTY_GYM_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadGymData().then((loaded) => {
      if (cancelled) return;
      setData(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) saveGymData(data);
  }, [data, ready]);

  const addClient = useCallback((input: NewClient) => {
    const client: Client = { ...input, id: newId("client"), joinedOn: todayISO() };
    setData((d) => ({ ...d, clients: [client, ...d.clients] }));
    return client;
  }, []);

  const addTrainer = useCallback((input: NewTrainer) => {
    const trainer: Trainer = { ...input, id: newId("trainer"), joinedOn: todayISO() };
    setData((d) => ({ ...d, trainers: [...d.trainers, trainer] }));
    return trainer;
  }, []);

  const addPlan = useCallback((input: NewPlan) => {
    const plan: Plan = { ...input, id: newId("plan") };
    setData((d) => ({ ...d, plans: [...d.plans, plan] }));
    return plan;
  }, []);

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
      return membership;
    },
    [data.plans],
  );

  const addPayment = useCallback((input: NewPayment) => {
    const payment: Payment = { ...input, id: newId("payment"), membershipId: null };
    setData((d) => ({ ...d, payments: [payment, ...d.payments] }));
    return payment;
  }, []);

  const markPaymentPaid = useCallback((paymentId: string) => {
    setData((d) => ({
      ...d,
      payments: d.payments.map((p) =>
        p.id === paymentId ? { ...p, status: "paid", date: todayISO() } : p,
      ),
    }));
  }, []);

  const checkIn = useCallback(
    (clientId: string) => {
      const today = todayISO();
      if (data.attendance.some((a) => a.clientId === clientId && dateOf(a.checkedInAt) === today)) {
        return "duplicate" as const;
      }
      const record = { id: newId("att"), clientId, checkedInAt: new Date().toISOString() };
      setData((d) => ({ ...d, attendance: [record, ...d.attendance] }));
      return "ok" as const;
    },
    [data.attendance],
  );

  const resetDemo = useCallback(async () => {
    setReady(false);
    setData(await resetGymData());
    setReady(true);
  }, []);

  const value = useMemo<GymStore>(
    () => ({
      ready,
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
