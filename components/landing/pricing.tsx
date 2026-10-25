import Link from "next/link";
import { Check } from "lucide-react";

import { ChalkGrain } from "@/components/graphics/chalk-grain";
import { PlateRings } from "@/components/graphics/plate-rings";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { pricingContent as content, type PlanLimits } from "@/content/landing";
import { formatMoney } from "@/lib/format";
import { cn, revealDelay } from "@/lib/utils";

/** Monthly prices only (there is no yearly billing). */
export function Pricing() {
  const currency = content.currency;

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="cut-bg relative overflow-hidden bg-surface section-y"
    >
      <ChalkGrain />
      <PlateRings className="absolute -top-40 -left-48 size-[36rem] text-fg/5" />
      <PlateRings className="absolute -right-32 -bottom-40 size-[28rem] text-fg/5" />
      <div className="relative container-x">
        <SectionHeading copy={content} id="pricing-title" />

        <ul className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
          {content.plans.map((plan, i) => {
            const perMonth = plan.prices[currency].monthly;
            return (
              <li
                key={plan.id}
                data-reveal
                style={revealDelay(i, 100)}
                className={cn(
                  "relative flex flex-col rounded-3xl border bg-bg p-7 md:p-8",
                  plan.highlighted
                    ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
                    : "border-border",
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 font-mono text-xs font-bold tracking-wider text-iron uppercase">
                    {content.recommendedBadge}
                  </span>
                )}
                <h3 className="font-display text-4xl tracking-wide uppercase">{plan.name}</h3>
                <p className="mt-1 text-muted">{plan.tagline}</p>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-6xl leading-none tracking-wide">
                    {formatMoney(perMonth, currency)}
                  </span>
                  <span className="text-muted">{content.perMonth}</span>
                </p>
                <p className="mt-2 text-sm text-muted">{content.billedMonthly}</p>

                <dl className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-border p-3 text-center">
                  {(Object.keys(content.limitLabels) as (keyof PlanLimits)[]).map((key) => (
                    <div key={key} className="flex flex-col">
                      <dt className="text-xs text-muted">{content.limitLabels[key]}</dt>
                      <dd className="order-first font-semibold">
                        {plan.limits[key] === null ? (
                          <span title={content.unlimitedLabel}>
                            <span aria-hidden="true">{content.unlimitedSymbol}</span>
                            <span className="sr-only">{content.unlimitedLabel}</span>
                          </span>
                        ) : (
                          plan.limits[key]
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary-ink" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  variant={plan.highlighted ? "primary" : "outline"}
                  className="mt-8 w-full"
                >
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                </Button>
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-center text-sm text-muted">{content.footnote}</p>
      </div>
    </section>
  );
}
