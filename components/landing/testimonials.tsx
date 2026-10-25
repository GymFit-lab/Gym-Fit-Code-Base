"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { testimonialsContent as content } from "@/content/landing";
import { cn, fill, initials } from "@/lib/utils";

/**
 * Scroll-snap carousel: swipeable and scrollable without JS; buttons and dots enhance it.
 * Shows 1 slide on mobile, 2 on tablet, 3 on desktop.
 */
export function Testimonials() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  // Assume scrollable until measured, so the controls reserve their space (no layout shift).
  const [scrollable, setScrollable] = useState(true);
  const total = content.items.length;

  const update = useCallback(() => {
    const track = trackRef.current;
    const slide = track?.firstElementChild as HTMLElement | null;
    if (!track || !slide) return;
    setIndex(Math.round(track.scrollLeft / slide.offsetWidth));
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
    setScrollable(track.scrollWidth > track.clientWidth + 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  // Once scrolled to the end, the last slide is the "current" one even if several are visible.
  const current = atEnd && index > 0 ? total - 1 : index;

  function goTo(target: number) {
    const track = trackRef.current;
    const slide = track?.children[target] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }

  return (
    <section aria-labelledby="testimonials-title" className="section-y">
      <div className="container-x">
        <SectionHeading copy={content} id="testimonials-title" />

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={content.carouselLabel}
          className="mt-14"
        >
          <ul
            ref={trackRef}
            onScroll={update}
            className="-mx-2 flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
          >
            {content.items.map((t, i) => (
              <li
                key={t.name}
                role="group"
                aria-roledescription="slide"
                aria-label={fill(content.slideLabel, { n: i + 1, total })}
                className="w-full shrink-0 snap-start px-2 md:w-1/2 lg:w-1/3"
              >
                <figure className="flex h-full flex-col rounded-3xl border border-border bg-surface p-7">
                  <div className="flex items-start justify-between">
                    <Quote aria-hidden="true" className="size-8 text-primary-ink" />
                    {t.placeholder && (
                      <span className="rounded-full border border-accent/50 px-2 py-0.5 font-mono text-[0.65rem] tracking-wider text-accent-ink uppercase">
                        {content.placeholderBadge}
                      </span>
                    )}
                  </div>
                  <blockquote className="mt-5 flex-1 text-lg leading-relaxed">{t.quote}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-11 place-items-center rounded-full bg-primary font-bold text-iron"
                    >
                      {initials(t.name)}
                    </span>
                    <span>
                      <span className="block font-semibold">{t.name}</span>
                      <span className="block text-sm text-muted">
                        {t.role} · {t.gym}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              "mt-8 flex items-center justify-center gap-4",
              !scrollable && "invisible",
            )}
          >
            <Button
              variant="outline"
              size="icon"
              aria-label={content.prevLabel}
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <ul className="flex">
              {content.items.map((t, i) => (
                <li key={t.name}>
                  <button
                    type="button"
                    aria-label={fill(content.goToLabel, { n: i + 1 })}
                    aria-current={current === i}
                    onClick={() => goTo(i)}
                    className="group grid size-11 place-items-center"
                  >
                    <span
                      className={cn(
                        "h-2 rounded-full transition-all",
                        current === i ? "w-6 bg-primary" : "w-2 bg-fg/25 group-hover:bg-fg/50",
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="icon"
              aria-label={content.nextLabel}
              disabled={atEnd}
              onClick={() => goTo(Math.min(index + 1, total - 1))}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
