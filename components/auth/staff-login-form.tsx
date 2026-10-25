"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { staffSignIn } from "@/app/actions/fitva-auth";
import { FormField, fieldA11y } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authContent } from "@/content/auth";
import { staffLoginSchema, type StaffLoginValues } from "@/lib/schemas/auth";

const copy = authContent.login;
const { fields } = authContent.fitva;

/** Email/password form for gym staff (AUTH_MODE=fitva, lib/fitva/session.ts). */
export function StaffLoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffLoginValues>({
    resolver: zodResolver(staffLoginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      setServerError(null);
      // On success the action redirects to the dashboard; it only returns on failure.
      const result = await staffSignIn(values);
      if (result?.error) setServerError(result.error);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="staff-email" label={fields.email.label} error={errors.email?.message}>
        <Input
          {...fieldA11y("staff-email", errors.email?.message)}
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={fields.email.placeholder}
          {...register("email")}
        />
      </FormField>

      <FormField id="staff-password" label={fields.password.label} error={errors.password?.message}>
        <PasswordInput
          {...fieldA11y("staff-password", errors.password?.message)}
          autoComplete="current-password"
          placeholder={fields.password.placeholder}
          {...register("password")}
        />
      </FormField>

      {serverError && (
        <p role="alert" className="text-sm text-accent-ink">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
