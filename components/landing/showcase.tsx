"use client";

import { useState } from "react";

import { DashboardMockup } from "@/components/graphics/dashboard-mockup";
import { SectionHeading } from "@/components/section-heading";
import { showcaseContent as content, type Hotspot } from "@/content/landing";
import { cn } from "@/lib/utils";

/**
 * Numbered marker drawn on the mockup. The mockup is aria-hidden, so markers are pointer-only
 * (tabIndex -1); keyboard and screen-reader users get the same content from the list beside it.
 */
function Marker({
  spot,
  index,
  active,
  onActivate,
}: {
  spot: Hotspot;
  index: number;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <span className={cn("absolute -top-3 z-10", spot.align === "left" ? "-left-3" : "-right-3")}>
      <button
        type="button"
        tabIndex={-1}
        onMouseEnter={onActivate}
        onClick={onActivate}
        className={cn(
          "relative grid size-9 place-items-center rounded-full text-sm font-bold shadow-lg transition-colors",
          active ? "bg-primary text-iron" : "bg-fg text-bg",
        )}
      >
        {active && <span className="hotspot-pulse absolute inset-0 rounded-full bg-primary" />}
        <span className="relative">{index + 1}</span>
      </button>
      {/* On small screens the list sits below the mockup, so show the tip in place too. */}
      {active && (
        <span
          className={cn(
            "pop-in absolute top-11 w-56 rounded-2xl border border-border-strong bg-surface p-3 text-left shadow-xl lg:hidden",
            spot.align === "left" ? "left-0" : "right-0",
          )}
        >
          <span className="block text-sm font-semibold">{spot.title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted">{spot.text}</span>
        </span>
      )}
    </span>
  );
}

export function Showcase() {
  const [active, setActive] = useState<Hotspot["id"]>(content.hotspots[0].id);

  const markers = Object.fromEntries(
    content.hotspots.map((spot, i) => [
      spot.id,
      <Marker
        key={spot.id}
        spot={spot}
        index={i}
        active={active === spot.id}
        onActivate={() => setActive(spot.id)}
      />,
    ]),
  );

  return (
    <section aria-labelledby="showcase-title" className="section-y">
      <div className="container-x">
        <SectionHeading copy={content} id="showcase-title" />

        <figure className="mt-14 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Highlight the active area of the mockup via its data-hotspot attribute. */}
          <div className="[&_[data-hotspot]]:opacity-60 [&_[data-hotspot]]:transition-[box-shadow,opacity] [&_[data-hotspot]]:duration-300">
            <style>{`[data-hotspot="${active}"]{opacity:1!important;box-shadow:0 0 0 2px var(--primary)}`}</style>
            <DashboardMockup markers={markers} className="overflow-visible" />
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
