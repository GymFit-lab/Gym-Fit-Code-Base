"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { demoSignIn } from "@/app/actions/demo-auth";
import { FormField, fieldA11y } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authContent } from "@/content/auth";
import { demoLoginSchema, type DemoLoginValues } from "@/lib/schemas/auth";

const copy = authContent.login;
const { fields } = authContent.demo;

/** ⚠️ TEMPORARY — username/password form for demo mode (lib/auth-mode.ts). */
export function DemoLoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DemoLoginValues>({
    resolver: zodResolver(demoLoginSchema),
    mode: "onTouched",
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      setServerError(null);
      // On success the action redirects to the dashboard; it only returns on failure.
      const result = await demoSignIn(values);
      if (result?.error) setServerError(result.error);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FormField id="demo-username" label={fields.username.label} error={errors.username?.message}>
        <Input
          {...fieldA11y("demo-username", errors.username?.message)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={fields.username.placeholder}
          {...register("username")}
        />
      </FormField>

      <FormField id="demo-password" label={fields.password.label} error={errors.password?.message}>
        <PasswordInput
          {...fieldA11y("demo-password", errors.password?.message)}
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
