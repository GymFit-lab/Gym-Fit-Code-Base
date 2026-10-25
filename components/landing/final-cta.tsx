import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { ChalkGrain } from "@/components/graphics/chalk-grain";
import { PlateRings } from "@/components/graphics/plate-rings";
import { DemoForm } from "@/components/landing/demo-form";
import { Magnetic } from "@/components/magnetic";
import { Button } from "@/components/ui/button";
import { finalCtaContent as content } from "@/content/landing";

/** Full-width lime → ember band. Text on the band uses the fixed `iron` ink in both themes. */
export function FinalCta() {
  return (
    <section
      id="demo"
      aria-labelledby="demo-title"
      className="ember-band cut-bg relative overflow-hidden section-y text-iron"
    >
      <ChalkGrain />
      <PlateRings className="absolute -top-24 -left-40 size-[34rem] text-iron/15" />
      <div className="relative container-x grid items-center gap-12 lg:grid-cols-2">
        <div data-reveal>
          <p className="font-mono text-xs font-semibold tracking-[0.18em] uppercase">
            {content.eyebrow}
          </p>
          <h2
            id="demo-title"
            className="mt-4 font-display text-6xl leading-[0.9] tracking-wide uppercase md:text-8xl"
          >
            <span className="block">{content.headline.lead}</span>
            <span className="block">{content.headline.punch}</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-iron/80">{content.text}</p>
          <Magnetic className="mt-8">
            <Button asChild variant="ink" size="lg">
              <Link href={content.trialCta.href}>
                {content.trialCta.label}
                <ArrowRight />
              </Link>
            </Button>
          </Magnetic>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {content.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          data-reveal
          className="rounded-3xl border border-border-strong bg-surface p-6 text-fg shadow-2xl shadow-black/30 md:p-8"
        >
          <h3 className="font-display text-4xl tracking-wide uppercase">{content.form.title}</h3>
          <p className="mt-2 mb-6 text-muted">{content.form.description}</p>
          <DemoForm />
        </div>
      </div>
    </section>
  );
}
