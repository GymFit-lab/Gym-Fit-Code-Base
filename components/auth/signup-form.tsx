"use client";

import { useState } from "react";
import Link from "next/link";
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
import { signupSchema, type SignupValues } from "@/lib/schemas/auth";

const copy = authContent.signup;
const { fields } = authContent;

export function SignupForm({
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
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setServerError(null);
    // autoSignIn is on (lib/auth.ts), so a successful sign-up also starts a session.
    const { error } = await authClient.signUp.email({ name, email, password });
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
            errorCallbackURL="/signup"
            onError={setServerError}
          />
          <AuthDivider />
        </>
      )}

      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <FormField id="signup-name" label={fields.name.label} error={errors.name?.message}>
          <Input
            {...fieldA11y("signup-name", errors.name?.message)}
            autoComplete="name"
            placeholder={fields.name.placeholder}
            {...register("name")}
          />
        </FormField>

        <FormField id="signup-email" label={fields.email.label} error={errors.email?.message}>
          <Input
            {...fieldA11y("signup-email", errors.email?.message)}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={fields.email.placeholder}
            {...register("email")}
          />
        </FormField>

        <FormField
          id="signup-password"
          label={fields.password.label}
          error={errors.password?.message}
        >
          <PasswordInput
            {...fieldA11y("signup-password", errors.password?.message)}
            autoComplete="new-password"
            placeholder={fields.password.placeholder}
            {...register("password")}
          />
        </FormField>

        {serverError && (
          <p role="alert" className="text-sm text-accent-ink">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? copy.submitting : copy.submit}
        </Button>

        <p className="text-center text-xs text-muted">
          {copy.terms.before}
          <Link href={copy.terms.terms.href} className="underline hover:text-fg">
            {copy.terms.terms.label}
          </Link>
          {copy.terms.and}
          <Link href={copy.terms.privacy.href} className="underline hover:text-fg">
            {copy.terms.privacy.label}
          </Link>
          {copy.terms.after}
        </p>
      </form>
    </>
  );
}
