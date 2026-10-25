import Link from "next/link";
import { ArrowRight, BellRing, Check, ScanLine } from "lucide-react";

import { ChalkGrain } from "@/components/graphics/chalk-grain";
import { DashboardMockup } from "@/components/graphics/dashboard-mockup";
import { EcgLine } from "@/components/graphics/ecg-line";
import { PlateRings } from "@/components/graphics/plate-rings";
import { KineticWord } from "@/components/landing/kinetic-word";
import { Magnetic } from "@/components/magnetic";
import { Button } from "@/components/ui/button";
import { dashboardMockup, heroContent as hero } from "@/content/landing";
import { cn, cssVars } from "@/lib/utils";

/** Floating notification card next to the hero mockup (decorative). */
function FloatCard({
  icon: Icon,
  title,
  text,
  className,
  delay,
}: {
  icon: typeof BellRing;
  title: string;
  text: string;
  className: string;
  delay: string;
}) {
  return (
    <div
      aria-hidden="true"
      style={cssVars({ "--float-delay": delay })}
      className={cn(
        "float-y absolute z-10 hidden items-center gap-3 rounded-2xl border border-border-strong bg-surface/95 p-3 pr-5 shadow-xl shadow-black/30 backdrop-blur md:flex",
        className,
      )}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-iron">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="hero-aura absolute inset-0" />
      <div aria-hidden="true" className="floor-grid absolute inset-0" />
      <ChalkGrain />

      <div className="relative container-x grid items-center gap-14 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
        <div>
          <p
            className="hero-fade font-display text-3xl tracking-wide text-muted uppercase md:text-4xl"
            style={cssVars({ "--d": "0ms" })}
          >
            <span className="sr-only">{hero.kinetic.srText}</span>
            <span aria-hidden="true">
              {hero.kinetic.prefix}{" "}
              <KineticWord words={hero.kinetic.words} className="text-accent-ink" />
            </span>
          </p>
          <h1
            id="hero-title"
            className="mt-3 font-display text-6xl leading-[0.9] tracking-wide uppercase xs:text-7xl md:text-8xl xl:text-9xl"
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
            <Magnetic>
              <Button asChild size="lg">
                <Link href={hero.primaryCta.href}>
                  {hero.primaryCta.label}
                  <ArrowRight />
                </Link>
              </Button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Button asChild variant="outline" size="lg">
                <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
              </Button>
            </Magnetic>
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

        <div className="hero-fade relative" style={cssVars({ "--d": "300ms" })}>
          <PlateRings className="absolute top-1/2 left-1/2 size-[30rem] -translate-1/2 text-fg/10 md:size-[38rem]" />
          <PlateRings className="absolute -top-24 -right-28 size-56 text-primary-ink/25 max-lg:hidden" />
          <div className="relative [perspective:1600px]">
            <DashboardMockup className="mockup-tilt" />
          </div>
          <FloatCard
            icon={BellRing}
            title={dashboardMockup.toast.title}
            text={dashboardMockup.toast.text}
            className="-top-6 right-4 lg:-right-6"
            delay="0s"
          />
          <FloatCard
            icon={ScanLine}
            title={dashboardMockup.checkIn.title}
            text={dashboardMockup.checkIn.text}
            className="-bottom-8 left-4 lg:-left-10"
            delay="-3.5s"
          />
        </div>
      </div>

      <EcgLine beats={6} className="relative -mt-8 text-primary" />
    </section>
  );
}
