"use server";

import { finalCtaContent } from "@/content/landing";
import { demoFormSchema, type DemoFormState } from "@/lib/schemas/demo-form";

const { messages, success } = finalCtaContent.form;

/** Server Action for the "Book a demo" form. Re-validates with the shared schema. */
export async function submitDemoRequest(values: unknown): Promise<DemoFormState> {
  const parsed = demoFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: messages.invalid,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // PLACEHOLDER: no CRM/email backend yet — wire this to a real destination before launch.
    console.info("[demo-request]", parsed.data);
    return { status: "success", message: success.text };
  } catch {
    return { status: "error", message: messages.failed };
  }
}
