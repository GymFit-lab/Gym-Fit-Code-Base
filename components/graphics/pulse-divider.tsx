import { EcgLine } from "@/components/graphics/ecg-line";

/** Faint heartbeat line that runs across the seam between two sections. */
export function PulseDivider() {
  return (
    <div aria-hidden="true" className="relative z-10 -my-8 opacity-40">
      <EcgLine beats={8} className="h-16 text-primary" />
    </div>
  );
}
