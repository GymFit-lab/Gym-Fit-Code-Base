import Link from "next/link";

import { commonContent } from "@/content/landing";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={commonContent.homeLabel}
      className={cn("font-display text-3xl leading-none tracking-wide", className)}
    >
      {siteConfig.wordmark.lead}
      <span className="text-primary-ink">{siteConfig.wordmark.accent}</span>
    </Link>
  );
}
