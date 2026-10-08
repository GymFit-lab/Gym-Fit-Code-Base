"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { submitDemoRequest } from "@/app/actions/demo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { finalCtaContent, memberRanges } from "@/content/landing";
import {
  demoFormSchema,
  initialDemoFormState,
  type DemoFormField,
  type DemoFormState,
  type DemoFormValues,
} from "@/lib/schemas/demo-form";

const form = finalCtaContent.form;
const textFields: {
  name: Exclude<DemoFormField, "members">;
  type: string;
  autoComplete: string;
}[] = [
  { name: "name", type: "text", autoComplete: "name" },
  { name: "gymName", type: "text", autoComplete: "organization" },
  { name: "phone", type: "tel", autoComplete: "tel" },
  { name: "email", type: "email", autoComplete: "email" },
  { name: "city", type: "text", autoComplete: "address-level2" },
];

export function DemoForm() {
  const [state, setState] = useState<DemoFormState>(initialDemoFormState);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DemoFormValues>({ resolver: zodResolver(demoFormSchema), mode: "onTouched" });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await submitDemoRequest(values);
      setState(result);
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as DemoFormField, { message: messages[0] });
      }
    }),
  );

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 className="size-14 text-primary-ink" />
        <h3 className="mt-4 font-display text-4xl tracking-wide uppercase">{form.success.title}</h3>
        <p className="mt-2 text-muted">{form.success.text}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      {textFields.map(({ name, type, autoComplete }) => (
        <div key={name} className="grid gap-2">
          <Label htmlFor={`demo-${name}`}>{form.fields[name].label}</Label>
          <Input
            id={`demo-${name}`}
            type={type}
            autoComplete={autoComplete}
            placeholder={form.fields[name].placeholder}
            aria-invalid={errors[name] ? true : undefined}
            aria-describedby={errors[name] ? `demo-${name}-error` : undefined}
            {...register(name)}
          />
          {errors[name] && (
            <p id={`demo-${name}-error`} className="text-sm text-accent-ink">
              {errors[name]?.message}
            </p>
          )}
        </div>
      ))}

      <div className="grid gap-2">
        <Label htmlFor="demo-members">{form.fields.members.label}</Label>
        <NativeSelect
          id="demo-members"
          defaultValue=""
          aria-invalid={errors.members ? true : undefined}
          aria-describedby={errors.members ? "demo-members-error" : undefined}
          {...register("members")}
        >
          <option value="" disabled>
            {form.fields.members.placeholder}
          </option>
          {memberRanges.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </NativeSelect>
        {errors.members && (
          <p id="demo-members-error" className="text-sm text-accent-ink">
            {errors.members.message}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        {state.status === "error" && state.message && (
          <p role="alert" className="mb-4 text-sm text-accent-ink">
            {state.message}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? form.submitting : form.submit}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          {form.privacyNote.before}
          <Link href={form.privacyNote.link.href} className="underline hover:text-fg">
            {form.privacyNote.link.label}
          </Link>
          {form.privacyNote.after}
        </p>
      </div>
    </form>
  );
}
