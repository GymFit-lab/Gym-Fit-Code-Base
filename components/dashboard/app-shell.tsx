import {
  BarChart3,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  ScanLine,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { DashboardNavLink } from "@/components/dashboard/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { dashboardContent, type DashboardNavItem } from "@/content/dashboard";
import { cn, initials } from "@/lib/utils";

const icons: Record<DashboardNavItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  clients: Users,
  memberships: CalendarClock,
  attendance: ScanLine,
  trainers: UserCog,
  payments: CreditCard,
  reports: BarChart3,
};

function NavItem({ item, compact }: { item: DashboardNavItem; compact?: boolean }) {
  const Icon = icons[item.icon];
  const base = cn(
    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors",
    compact && "shrink-0 rounded-full px-4",
  );

  if (item.soon) {
    return (
      <span aria-disabled="true" className={cn(base, "cursor-not-allowed text-muted/70")}>
        <Icon className="size-4.5 shrink-0" aria-hidden="true" />
        {item.label}
        <span className="ml-auto rounded-full border border-border-strong px-1.5 py-0.5 font-mono text-[0.6rem] tracking-wider uppercase">
          {dashboardContent.soonBadge}
        </span>
      </span>
    );
  }

  return (
    <DashboardNavLink
      href={item.href}
      className={base}
      activeClassName="bg-primary text-iron"
      inactiveClassName="text-muted hover:bg-fg/5 hover:text-fg"
    >
      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
      {item.label}
    </DashboardNavLink>
  );
}

/** Signed-in app chrome: sidebar on desktop, scrollable tab row on mobile, top bar with user. */
export function AppShell({
  user,
  demoAuth,
  children,
}: {
  user: { name: string; email: string };
  demoAuth: boolean;
  children: React.ReactNode;
}) {
  const { nav, navLabel } = dashboardContent;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Wordmark className="px-3" />
        <nav aria-label={navLabel} className="mt-10">
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <NavItem item={item} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto rounded-2xl border border-border bg-bg/60 p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-mono text-sm font-bold text-iron">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <SignOutButton demo={demoAuth} variant="ghost" size="sm" className="mt-3 w-full" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-lg">
          <div className="flex h-16 items-center gap-3 px-4 md:px-8">
            <Wordmark className="text-2xl lg:hidden" />
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <SignOutButton demo={demoAuth} variant="ghost" size="sm" className="lg:hidden" />
            </div>
          </div>
          <nav aria-label={navLabel} className="border-t border-border lg:hidden">
            <ul className="flex gap-1 overflow-x-auto px-4 py-2">
              {nav.map((item) => (
                <li key={item.href}>
                  <NavItem item={item} compact />
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main id="main" className="px-4 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
