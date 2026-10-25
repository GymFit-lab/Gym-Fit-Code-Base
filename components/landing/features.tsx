import { ChalkGrain } from "@/components/graphics/chalk-grain";
import { FeatureVisual } from "@/components/landing/feature-visual";
import { SectionHeading } from "@/components/section-heading";
import { featuresContent as content, type FeatureSize } from "@/content/landing";
import { cn, revealDelay } from "@/lib/utils";

const sizeClasses: Record<FeatureSize, string> = {
  lg: "md:col-span-2 lg:col-span-2 lg:row-span-2",
  wide: "md:col-span-2 lg:col-span-2",
  sm: "",
  full: "md:col-span-2 lg:col-span-4",
};

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="cut-bg relative bg-surface section-y"
    >
      <ChalkGrain />
      <div className="relative container-x">
        <SectionHeading copy={content} id="features-title" />

        <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {content.items.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                data-reveal
                style={revealDelay(i, 60)}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-bg p-6 transition-colors hover:border-primary/50 md:p-7",
                  sizeClasses[feature.size],
                )}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-primary text-iron">
                  <Icon className="wiggle-target size-5" />
                </span>
                <h3
                  className={cn(
                    "mt-6 font-bold",
                    feature.size === "lg" ? "text-2xl md:text-3xl" : "text-xl",
                  )}
                >
                  {feature.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted">{feature.benefit}</p>
                <div aria-hidden="true" className="mt-auto pt-6">
                  <FeatureVisual kind={feature.visual} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
