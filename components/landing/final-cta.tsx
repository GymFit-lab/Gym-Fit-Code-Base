import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { DemoForm } from "@/components/landing/demo-form";
import { Button } from "@/components/ui/button";
import { finalCtaContent as content } from "@/content/landing";

export function FinalCta() {
  return (
    <section id="demo" aria-labelledby="demo-title" className="relative overflow-hidden section-y">
      <div aria-hidden="true" className="hero-aura absolute inset-0" />
      <div className="relative container-x grid items-center gap-12 lg:grid-cols-2">
        <div data-reveal>
          <p className="eyebrow">{content.eyebrow}</p>
          <h2
            id="demo-title"
            className="mt-4 font-display text-6xl leading-[0.9] tracking-wide uppercase md:text-8xl"
          >
            <span className="block">{content.headline.lead}</span>
            <span className="block text-primary-ink">{content.headline.punch}</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">{content.text}</p>
          <Button asChild size="lg" className="mt-8">
            <Link href={content.trialCta.href}>
              {content.trialCta.label}
              <ArrowRight />
            </Link>
          </Button>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {content.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 text-primary-ink" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal className="rounded-3xl border border-border-strong bg-surface p-6 md:p-8">
          <h3 className="font-display text-4xl tracking-wide uppercase">{content.form.title}</h3>
          <p className="mt-2 mb-6 text-muted">{content.form.description}</p>
          <DemoForm />
        </div>
      </div>
    </section>
  );
}
