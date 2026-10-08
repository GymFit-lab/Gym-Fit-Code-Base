"use client";

import { useState } from "react";

import { DashboardMockup } from "@/components/graphics/dashboard-mockup";
import { SectionHeading } from "@/components/section-heading";
import { showcaseContent as content, type Hotspot } from "@/content/landing";
import { cn } from "@/lib/utils";

export function Showcase() {
  const [active, setActive] = useState<Hotspot["id"]>(content.hotspots[0].id);

  return (
    <section aria-labelledby="showcase-title" className="section-y">
      <div className="container-x">
        <SectionHeading copy={content} id="showcase-title" />

        <figure className="mt-14 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Highlight the active area of the mockup via its data-hotspot attribute. */}
          <div className="[&_[data-hotspot]]:opacity-60 [&_[data-hotspot]]:transition-[box-shadow,opacity] [&_[data-hotspot]]:duration-300">
            <style>{`[data-hotspot="${active}"]{opacity:1!important;box-shadow:0 0 0 2px var(--primary)}`}</style>
            <DashboardMockup />
          </div>

          <ol className="space-y-2">
            {content.hotspots.map((spot, i) => (
              <li key={spot.id}>
                <button
                  type="button"
                  aria-pressed={active === spot.id}
                  onMouseEnter={() => setActive(spot.id)}
                  onFocus={() => setActive(spot.id)}
                  onClick={() => setActive(spot.id)}
                  className={cn(
                    "flex w-full gap-4 rounded-2xl border p-4 text-left transition-colors",
                    active === spot.id
                      ? "border-primary/60 bg-surface"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  <span
                    className={cn(
                      "relative grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                      active === spot.id ? "bg-primary text-iron" : "bg-fg/10",
                    )}
                  >
                    {active === spot.id && (
                      <span
                        aria-hidden="true"
                        className="hotspot-pulse absolute inset-0 rounded-full bg-primary"
                      />
                    )}
                    <span className="relative">{i + 1}</span>
                  </span>
                  <span>
                    <span className="block font-semibold">{spot.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">
                      {spot.text}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <figcaption className="sr-only">{content.figureCaption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
