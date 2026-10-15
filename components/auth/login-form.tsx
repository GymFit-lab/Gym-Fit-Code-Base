"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormField, fieldA11y } from "@/components/auth/form-field";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authContent } from "@/content/auth";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { loginSchema, type LoginValues } from "@/lib/schemas/auth";

const copy = authContent.login;
const { fields } = authContent;

export function LoginForm({
  googleEnabled,
  callbackURL,
}: {
  googleEnabled: boolean;
  callbackURL: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = handleSubmit(async ({ email, password, rememberMe }) => {
    setServerError(null);
    const { error } = await authClient.signIn.email({ email, password, rememberMe });
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    router.replace(callbackURL);
    router.refresh();
  });

  return (
    <>
      {googleEnabled && (
        <>
          <GoogleButton
            callbackURL={callbackURL}
            errorCallbackURL="/login"
            onError={setServerError}
          />
          <AuthDivider />
        </>
      )}

      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <FormField id="login-email" label={fields.email.label} error={errors.email?.message}>
          <Input
            {...fieldA11y("login-email", errors.email?.message)}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={fields.email.placeholder}
            {...register("email")}
          />
        </FormField>

        <FormField
          id="login-password"
          label={fields.loginPassword.label}
          error={errors.password?.message}
        >
          <PasswordInput
            {...fieldA11y("login-password", errors.password?.message)}
            autoComplete="current-password"
            placeholder={fields.loginPassword.placeholder}
            {...register("password")}
          />
        </FormField>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted select-none">
          <input
            type="checkbox"
            className="size-5 rounded border-border-strong accent-[var(--primary-ink)]"
            {...register("rememberMe")}
          />
          {copy.rememberMe}
        </label>

        {serverError && (
          <p role="alert" className="text-sm text-accent-ink">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? copy.submitting : copy.submit}
        </Button>
      </form>
    </>
  );
}
