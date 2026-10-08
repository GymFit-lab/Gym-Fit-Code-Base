import { SectionHeading } from "@/components/section-heading";
import { howItWorksContent as content } from "@/content/landing";
import { revealDelay } from "@/lib/utils";

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="section-y">
      <div className="container-x">
        <SectionHeading copy={content} id="how-title" />

        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {content.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                data-reveal
                style={revealDelay(i, 120)}
                className="relative rounded-3xl border border-border bg-surface p-7"
              >
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
    </section>
  );
}
