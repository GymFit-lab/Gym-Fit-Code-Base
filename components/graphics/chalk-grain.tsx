import { cn } from "@/lib/utils";

/** Chalk-dust noise overlay. The parent must be positioned (`relative`/`absolute`). */
export function ChalkGrain({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("chalk-grain", className)} />;
}
