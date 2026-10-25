"use server";

/**
 * Gym data Server Actions for AUTH_MODE=fitva. The gym always comes from the signed-in staff
 * session, never from the browser. Inputs are re-validated with the same Zod schemas as the forms.
 * Every write returns the fresh `GymData`, so the store simply replaces its copy.
 */
import { callFn, callScalar } from "@/lib/fitva/db";
import { loadGymDataFromDb } from "@/lib/fitva/gym-data";
import type { GymData } from "@/lib/gym/types";
import {
  clientSchema,
  membershipSchema,
  paymentSchema,
  planSchema,
  trainerSchema,
} from "@/lib/schemas/gym";
import { requireGymId } from "@/lib/session";

export async function fetchGymData(): Promise<GymData> {
  return loadGymDataFromDb(await requireGymId());
}

/** Runs one write for the signed-in gym, then returns the reloaded data. */
async function write(run: (gymId: string) => Promise<unknown>): Promise<GymData> {
  const gymId = await requireGymId();
  await run(gymId);
  return loadGymDataFromDb(gymId);
}

export async function createClientRecord(input: unknown) {
  const v = clientSchema.parse(input);
  return write((gymId) =>
    callScalar("usp_client_save", [
      gymId,
      null,
      v.name,
      v.phone,
      v.email,
      v.gender,
      v.trainerId || null,
    ]),
  );
}

export async function createTrainerRecord(input: unknown) {
  const v = trainerSchema.parse(input);
  return write((gymId) =>
    callScalar("usp_trainer_save", [gymId, null, v.name, v.specialty, v.phone, v.email]),
  );
}

export async function createPlanRecord(input: unknown) {
  const v = planSchema.parse(input);
  return write((gymId) =>
    callScalar("usp_plan_save", [gymId, null, v.name, v.durationMonths, v.price]),
  );
}

export async function createMembershipRecord(input: unknown) {
  const v = membershipSchema.parse(input);
  return write((gymId) =>
    callFn("usp_membership_create", [
      gymId,
      v.clientId,
      v.planId,
      v.startDate,
      v.paymentStatus,
      v.method,
    ]),
  );
}

export async function createPaymentRecord(input: unknown) {
  const v = paymentSchema.parse(input);
  return write((gymId) =>
    callScalar("usp_payment_save", [
      gymId,
      null,
      v.clientId,
      v.amount,
      v.method,
      v.status,
      v.date,
      v.note,
    ]),
  );
}

export async function markPaymentPaidRecord(paymentId: string) {
  return write((gymId) => callScalar("usp_payment_mark_paid", [gymId, paymentId]));
}

/** A second check-in the same day is rejected by the database (uq_attendance_client_day). */
export async function checkInRecord(clientId: string) {
  return write((gymId) => callScalar("usp_attendance_check_in", [gymId, clientId]));
}
