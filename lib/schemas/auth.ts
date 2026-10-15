import { z } from "zod";

import { authContent } from "@/content/auth";

const { errors } = authContent;

/** Must match `emailAndPassword.minPasswordLength` / `maxPasswordLength` in lib/auth.ts. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const email = z.string().trim().toLowerCase().email(errors.email).max(160, errors.email);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, errors.passwordRequired),
  rememberMe: z.boolean(),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, errors.name).max(80, errors.name),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN, errors.passwordLength)
    .max(PASSWORD_MAX, errors.passwordMax),
});

/** ⚠️ TEMPORARY — demo login (username + password), see lib/demo-auth.ts. */
export const demoLoginSchema = z.object({
  username: z.string().trim().min(1, authContent.demo.errors.username).max(80),
  password: z.string().min(1, errors.passwordRequired).max(PASSWORD_MAX),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type DemoLoginValues = z.infer<typeof demoLoginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
