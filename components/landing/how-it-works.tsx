import { EcgLine } from "@/components/graphics/ecg-line";
import { PlateMark } from "@/components/graphics/plate-mark";
import { SectionHeading } from "@/components/section-heading";
import { howItWorksContent as content } from "@/content/landing";
import { revealDelay } from "@/lib/utils";

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="section-y">
      <div className="container-x">
        <SectionHeading copy={content} id="how-title" />

        {/* Heartbeat timeline: horizontal ECG on desktop, a vertical track on mobile. */}
        <div className="relative mt-14">
          <EcgLine
            beats={content.steps.length}
            className="pointer-events-none absolute inset-x-0 top-0 hidden text-primary md:block"
          />
          <ol className="relative grid gap-4 border-l-2 border-dashed border-primary-ink/40 pl-8 max-md:ml-5 md:grid-cols-3 md:border-0 md:pt-24 md:pl-0">
            {content.steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  data-reveal
                  style={revealDelay(i, 120)}
                  className="relative rounded-3xl border border-border bg-surface p-7"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-7 -left-[calc(3.25rem+1px)] grid size-10 place-items-center rounded-full border border-border-strong bg-bg text-fg md:-top-[5.25rem] md:left-1/2 md:-translate-x-1/2"
                  >
                    <PlateMark className="size-6" />
                  </span>
                  <span className="font-mono text-xs font-semibold tracking-widest text-primary-ink uppercase">
                    {content.stepLabel} {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon className="mt-6 size-8 text-primary-ink" />
                  <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
                  <span
                    aria-hidden="true"
                    className="absolute top-5 right-6 font-display text-7xl leading-none text-fg/5"
                  >
                    {i + 1}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
