import { statsContent as stats } from "@/content/landing";
import { revealDelay } from "@/lib/utils";

export function Stats() {
  const hasPlaceholder = stats.items.some((item) => item.placeholder);

  return (
    <section aria-labelledby="stats-title" className="border-y border-border bg-surface">
      <h2 id="stats-title" className="sr-only">
        {stats.srTitle}
      </h2>
      <div className="container-x py-12">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.items.map((item, i) => (
            <div
              key={item.label}
              data-reveal
              style={revealDelay(i)}
              className="flex flex-col gap-2"
            >
              <dt className="text-sm text-muted">{item.label}</dt>
              <dd className="order-first font-display text-6xl leading-none tracking-wide text-primary-ink">
                {item.pad ? String(item.value).padStart(item.pad, "0") : item.value}
                {item.suffix}
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
