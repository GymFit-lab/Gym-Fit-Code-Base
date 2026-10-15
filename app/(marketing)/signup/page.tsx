import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthNotice, AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";
import { authContent } from "@/content/auth";
import { pricingContent } from "@/content/landing";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { isDemoAuth } from "@/lib/auth-mode";
import { getCurrentUser } from "@/lib/session";
import { fill } from "@/lib/utils";

const copy = authContent.signup;

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; error?: string }>;
}) {
  if (await getCurrentUser()) redirect(authContent.afterAuthPath);

  // Demo mode has no database, so new accounts can't be created yet.
  if (isDemoAuth) {
    const { signupDisabled } = authContent.demo;
    return (
      <AuthShell copy={copy} notice={<AuthNotice>{signupDisabled.title}</AuthNotice>}>
        <p className="text-muted">{signupDisabled.body}</p>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href={signupDisabled.cta.href}>{signupDisabled.cta.label}</Link>
        </Button>
      </AuthShell>
    );
  }

  const { plan: planId, error } = await searchParams;
  // Only accept plan ids that exist in the pricing config (links come from /#pricing).
  const plan = pricingContent.plans.find((p) => p.id === planId);
  const callbackURL = plan
    ? `${authContent.afterAuthPath}?plan=${plan.id}`
    : authContent.afterAuthPath;

  const notice = error ? (
    <AuthNotice tone="error">{authContent.serverErrors.oauth}</AuthNotice>
  ) : plan ? (
    <AuthNotice>{fill(copy.selectedPlan, { plan: plan.name })}</AuthNotice>
  ) : null;

  return (
    <AuthShell copy={copy} notice={notice}>
      <SignupForm googleEnabled={isGoogleAuthEnabled} callbackURL={callbackURL} />
    </AuthShell>
  );
}
