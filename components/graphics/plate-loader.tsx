import { PlateRings } from "@/components/graphics/plate-rings";
import { commonContent } from "@/content/landing";

/** Full-area loading state: a spinning weight plate. */
export function PlateLoader() {
  return (
    <div role="status" className="grid min-h-[50vh] place-items-center">
      <PlateRings spin={false} className="plate-spin-fast size-20 text-primary-ink" />
      <span className="sr-only">{commonContent.loadingLabel}</span>
    </div>
  );
}
