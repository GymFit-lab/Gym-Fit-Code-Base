import { RepCounter } from "@/components/landing/rep-counter";
import { statsContent as stats } from "@/content/landing";
import { revealDelay } from "@/lib/utils";

export function Stats() {
  const hasPlaceholder = stats.items.some((item) => item.placeholder);

  return (
    <section aria-labelledby="stats-title" className="relative border-y border-border bg-surface">
      <h2 id="stats-title" className="sr-only">
        {stats.srTitle}
      </h2>
      <div className="relative container-x py-12">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.items.map((item, i) => (
            <div
              key={item.label}
              data-reveal
              style={revealDelay(i)}
              className="flex flex-col gap-2"
            >
              <dt className="text-sm text-muted">{item.label}</dt>
              <dd className="order-first font-mono text-5xl leading-none font-bold tracking-tight text-primary-ink md:text-6xl">
                <RepCounter value={item.value} pad={item.pad} />
                {item.suffix && <span className="text-2xl md:text-3xl">{item.suffix}</span>}
                {item.placeholder && <sup className="ml-1 text-2xl text-accent-ink">*</sup>}
              </dd>
            </div>
          ))}
        </dl>
        {hasPlaceholder && (
          <p className="mt-6 text-xs text-muted">
            <span className="text-accent-ink">*</span> {stats.placeholderNote}
          </p>
        )}
      </div>
    </section>
  );
}
