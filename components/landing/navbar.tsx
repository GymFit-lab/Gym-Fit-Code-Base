"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { navContent as nav } from "@/content/landing";
import { cn, cssVars } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-border bg-bg/80 backdrop-blur-lg" : "border-transparent bg-transparent",
      )}
    >
      <div className="container-x flex h-18 items-center gap-6">
        <Wordmark />

        <nav aria-label={nav.ariaLabel} className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-fg"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href={nav.login.href}>{nav.login.label}</Link>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href={nav.trial.href}>{nav.trial.label}</Link>
          </Button>

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button variant="outline" size="icon" aria-label={nav.openMenu} className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Content className="mobile-menu fixed inset-0 z-50 flex flex-col bg-bg p-6">
                <Dialog.Title className="sr-only">{nav.menuTitle}</Dialog.Title>
                <div className="flex items-center justify-between">
                  <Wordmark />
                  <Dialog.Close asChild>
                    <Button variant="outline" size="icon" aria-label={nav.closeMenu}>
                      <X className="size-5" />
                    </Button>
                  </Dialog.Close>
                </div>
                <nav aria-label={nav.mobileNavLabel} className="mt-12">
                  <ul className="space-y-2">
                    {nav.links.map((link, i) => (
                      <li
                        key={link.href}
                        className="mobile-menu-item"
                        style={cssVars({ "--i": i })}
                      >
                        <Dialog.Close asChild>
                          <Link
                            href={link.href}
                            className="block py-2 font-display text-5xl tracking-wide uppercase"
                          >
                            {link.label}
                          </Link>
                        </Dialog.Close>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-auto grid gap-3">
                  <Button asChild variant="outline" size="lg">
                    <Link href={nav.login.href}>{nav.login.label}</Link>
                  </Button>
                  <Button asChild size="lg">
                    <Link href={nav.trial.href}>{nav.trial.label}</Link>
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
