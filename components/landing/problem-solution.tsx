"use client";

import { useState } from "react";

import { SectionHeading } from "@/components/section-heading";
import { problemSolutionContent as content } from "@/content/landing";
import { cn, revealDelay } from "@/lib/utils";

export function ProblemSolution() {
  const [after, setAfter] = useState(true);

  return (
    <section aria-labelledby="problem-title" className="section-y">
      <div className="container-x">
        <SectionHeading copy={content} id="problem-title" />

        <div className="mt-10 flex justify-center">
          <div
            role="group"
            aria-label={content.toggleLabel}
            className="inline-flex rounded-full border border-border-strong bg-surface p-1"
          >
            {[false, true].map((value) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={after === value}
                onClick={() => setAfter(value)}
                className={cn(
                  "min-h-11 rounded-full px-5 text-sm font-semibold transition-colors",
                  after === value
                    ? value
                      ? "bg-primary text-iron"
                      : "bg-accent text-iron"
                    : "text-muted hover:text-fg",
                )}
              >
                {value ? content.toggle.after : content.toggle.before}
              </button>
            ))}
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          {after ? content.live.after : content.live.before}
        </p>

        <ul className="mt-12 grid gap-4 md:grid-cols-2">
          {content.items.map((item, i) => {
            const Icon = item.icon;
            const copy = after ? item.fix : item.pain;
            return (
              <li
                key={item.pain.title}
                data-reveal
                style={revealDelay(i)}
                className={cn(
                  "rounded-3xl border bg-surface p-6 transition-colors md:p-8",
                  after ? "border-primary/40" : "border-accent/40",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-11 place-items-center rounded-2xl",
                      after ? "bg-primary text-iron" : "bg-accent text-iron",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs font-semibold tracking-widest uppercase",
                      after ? "text-primary-ink" : "text-accent-ink",
                    )}
                  >
                    {after ? content.fixLabel : content.painLabel}
                  </span>
                </div>
                {/* Re-keyed on toggle so the swap animates in. */}
                <div key={String(after)} className="pop-in">
                  <h3 className="mt-5 text-xl font-bold">{copy.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{copy.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
