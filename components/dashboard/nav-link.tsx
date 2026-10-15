"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Sidebar/tab link that marks itself active (aria-current) based on the current URL. */
export function DashboardNavLink({
  href,
  className,
  activeClassName,
  inactiveClassName,
  children,
}: {
  href: string;
  className: string;
  activeClassName: string;
  inactiveClassName: string;
  children: React.ReactNode;
}) {
  const active = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active ? activeClassName : inactiveClassName)}
    >
      {children}
    </Link>
  );
}
