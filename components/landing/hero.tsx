import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { DashboardMockup } from "@/components/graphics/dashboard-mockup";
import { EcgLine } from "@/components/graphics/ecg-line";
import { Button } from "@/components/ui/button";
import { heroContent as hero } from "@/content/landing";
import { cssVars } from "@/lib/utils";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="hero-aura absolute inset-0" />
      <div aria-hidden="true" className="floor-grid absolute inset-0" />
      <div aria-hidden="true" className="chalk-grain" />

      <div className="relative container-x grid items-center gap-14 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
        <div>
          <p className="hero-fade eyebrow" style={cssVars({ "--d": "0ms" })}>
            <span className="sr-only">{hero.kinetic.srText}</span>
            <span aria-hidden="true">
              {hero.kinetic.prefix} · {hero.kinetic.words.join(" · ")}
            </span>
          </p>
          <h1
            id="hero-title"
            className="mt-5 font-display text-6xl leading-[0.9] tracking-wide uppercase xs:text-7xl md:text-8xl xl:text-9xl"
          >
            <span className="hero-rise block">{hero.headline.lead}</span>
            <span className="hero-rise block text-primary-ink" style={cssVars({ "--d": "120ms" })}>
              {hero.headline.punch}
            </span>
          </h1>
          <p
            className="hero-fade mt-6 max-w-xl text-lg leading-relaxed text-muted"
            style={cssVars({ "--d": "220ms" })}
          >
            {hero.subtext}
          </p>

          <div className="hero-fade mt-8 flex flex-wrap gap-3" style={cssVars({ "--d": "320ms" })}>
            <Button asChild size="lg">
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>

          <ul
            className="hero-fade mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"
            style={cssVars({ "--d": "420ms" })}
          >
            {hero.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 text-primary-ink" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-fade [perspective:1600px]" style={cssVars({ "--d": "300ms" })}>
          <DashboardMockup className="mockup-tilt" />
        </div>
      </div>

      <EcgLine beats={6} className="relative -mt-8 text-primary" />
    </section>
  );
}
