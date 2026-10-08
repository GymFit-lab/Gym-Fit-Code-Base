import { Quote } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { testimonialsContent as content } from "@/content/landing";
import { initials, revealDelay } from "@/lib/utils";

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title" className="section-y">
      <div className="container-x">
        <SectionHeading copy={content} id="testimonials-title" />

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {content.items.map((t, i) => (
            <li
              key={t.name}
              data-reveal
              style={revealDelay(i, 100)}
              className="flex flex-col rounded-3xl border border-border bg-surface p-7"
            >
              <figure className="flex h-full flex-col">
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
      </div>
    </section>
  );
}
