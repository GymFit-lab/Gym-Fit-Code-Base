import { cn } from "@/lib/utils";

/** Small weight-plate glyph: the logo mark, list bullets and timeline nodes. */
export function PlateMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={cn("size-4", className)}>
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="6" stroke="var(--primary)" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
