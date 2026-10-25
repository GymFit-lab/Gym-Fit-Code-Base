"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navContent } from "@/content/landing";
import { cn } from "@/lib/utils";

const { stickyCta } = navContent;

/**
 * Mobile-only bottom "Start Free Trial" bar. Hidden while the hero, the demo section
 * or the footer is on screen (they already show a trial button).
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = ["#hero", "#demo", "footer"]
      .map((selector) => document.querySelector(selector))
      .filter((el): el is Element => el !== null);
    if (!targets.length || !("IntersectionObserver" in window)) return;

    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setVisible(onScreen.size === 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg transition-transform duration-300 ease-out md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-sm text-muted">{stickyCta.note}</p>
        <Button asChild size="sm">
          <Link href={stickyCta.href}>
            {stickyCta.label}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
