import Link from "next/link";

import { PlateMark } from "@/components/graphics/plate-mark";
import { commonContent } from "@/content/landing";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={commonContent.homeLabel}
      className={cn(
        "inline-flex items-center gap-2 font-display text-3xl leading-none tracking-wide",
        className,
      )}
    >
      <PlateMark className="size-[0.85em]" />
      <span>
        {siteConfig.wordmark.lead}
        <span className="text-primary-ink">{siteConfig.wordmark.accent}</span>
      </span>
    </Link>
  );
}
