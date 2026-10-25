import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthNotice, AuthShell } from "@/components/auth/auth-shell";
import { DemoLoginForm } from "@/components/auth/demo-login-form";
import { LoginForm } from "@/components/auth/login-form";
import { StaffLoginForm } from "@/components/auth/staff-login-form";
import { authContent } from "@/content/auth";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { isDemoAuth, isFitvaAuth } from "@/lib/auth-mode";
import { DEMO_CREDENTIALS } from "@/lib/demo-auth";
import { getCurrentUser } from "@/lib/session";
import { fill } from "@/lib/utils";

const copy = authContent.login;

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect(authContent.afterAuthPath);

  const { error } = await searchParams;

  if (isFitvaAuth) {
    return (
      <AuthShell copy={copy} notice={<AuthNotice>{authContent.fitva.notice}</AuthNotice>}>
        <StaffLoginForm />
      </AuthShell>
    );
  }

  if (isDemoAuth) {
    return (
      <AuthShell
        copy={copy}
        notice={<AuthNotice>{fill(authContent.demo.notice, DEMO_CREDENTIALS)}</AuthNotice>}
      >
        <DemoLoginForm />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      copy={copy}
      notice={error ? <AuthNotice tone="error">{authContent.serverErrors.oauth}</AuthNotice> : null}
    >
      <LoginForm googleEnabled={isGoogleAuthEnabled} callbackURL={authContent.afterAuthPath} />
    </AuthShell>
  );
}
