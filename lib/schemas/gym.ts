import { z } from "zod";

import { gymContent } from "@/content/gym";

const { errors } = gymContent;

const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, errors.phone);
const optionalEmail = z.union([z.literal(""), z.string().trim().email(errors.email)]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, errors.date);
const choice = z.string().min(1, errors.required);

export const clientSchema = z.object({
  name: z.string().trim().min(2, errors.name).max(80, errors.name),
  phone,
  email: optionalEmail,
  gender: z.enum(["male", "female", "other"]),
  /** "" = no trainer. */
  trainerId: z.string(),
});
export type ClientFormValues = z.infer<typeof clientSchema>;

export const trainerSchema = z.object({
  name: z.string().trim().min(2, errors.name).max(80, errors.name),
  specialty: z.string().trim().min(2, errors.specialty).max(80, errors.specialty),
  phone,
  email: optionalEmail,
});
export type TrainerFormValues = z.infer<typeof trainerSchema>;

export const planSchema = z.object({
  name: z.string().trim().min(2, errors.planName).max(40, errors.planName),
  durationMonths: z
    .number({ invalid_type_error: errors.months })
    .int(errors.months)
    .min(1, errors.months)
    .max(36, errors.months),
  price: z.number({ invalid_type_error: errors.amount }).int(errors.amount).min(1, errors.amount),
});
export type PlanFormValues = z.infer<typeof planSchema>;

export const membershipSchema = z.object({
  clientId: choice,
  planId: choice,
  startDate: date,
  paymentStatus: z.enum(["paid", "pending"]),
  method: z.enum(["cash", "upi", "card", "bank"]),
});
export type MembershipFormValues = z.infer<typeof membershipSchema>;

export const attendanceSchema = z.object({ clientId: choice });
export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export const paymentSchema = z.object({
  clientId: choice,
  amount: z.number({ invalid_type_error: errors.amount }).int(errors.amount).min(1, errors.amount),
  method: z.enum(["cash", "upi", "card", "bank"]),
  status: z.enum(["paid", "pending"]),
  date,
  note: z.string().trim().max(120, errors.note),
});
export type PaymentFormValues = z.infer<typeof paymentSchema>;
