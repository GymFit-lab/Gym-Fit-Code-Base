import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/dashboard/app-shell";
import { isDemoAuth } from "@/lib/auth-mode";
import { GymDataProvider } from "@/lib/gym/store";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Signed-in area: every route in this group requires a session. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user} demoAuth={isDemoAuth}>
      <GymDataProvider>{children}</GymDataProvider>
    </AppShell>
  );
}
