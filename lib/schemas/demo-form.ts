import { z } from "zod";
import { finalCtaContent, memberRanges } from "@/content/landing";

const errors = finalCtaContent.form.errors;

/** Shared by the client form (React Hook Form) and the Server Action. */
export const demoFormSchema = z.object({
  name: z.string().trim().min(2, errors.name).max(80, errors.name),
  gymName: z.string().trim().min(2, errors.gymName).max(120, errors.gymName),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,18}[0-9]$/, errors.phone)
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 8 && digits <= 15;
    }, errors.phone),
  email: z.string().trim().email(errors.email).max(160, errors.email),
  city: z.string().trim().min(2, errors.city).max(80, errors.city),
  members: z.enum(memberRanges, { errorMap: () => ({ message: errors.members }) }),
});

export type DemoFormValues = z.infer<typeof demoFormSchema>;
export type DemoFormField = keyof DemoFormValues;

export type DemoFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<DemoFormField, string[]>>;
};

export const initialDemoFormState: DemoFormState = { status: "idle" };
