import type { SectionCopy } from "@/content/landing";
import { cn } from "@/lib/utils";

/** Renders `title` with the `highlight` substring in the brand colour. */
export function HighlightedTitle({ title, highlight }: Pick<SectionCopy, "title" | "highlight">) {
  const index = highlight ? title.indexOf(highlight) : -1;
  if (!highlight || index === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, index)}
      <span className="text-primary-ink">{highlight}</span>
      {title.slice(index + highlight.length)}
    </>
  );
}

export function SectionHeading({
  copy,
  id,
  align = "center",
  className,
}: {
  copy: SectionCopy;
  id?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      data-reveal
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <p className="eyebrow">{copy.eyebrow}</p>
      <h2
        id={id}
        className="mt-4 font-display text-5xl leading-[0.95] tracking-wide uppercase md:text-7xl"
      >
        <HighlightedTitle title={copy.title} highlight={copy.highlight} />
      </h2>
      {copy.description && (
        <p className="mt-5 text-lg leading-relaxed text-muted">{copy.description}</p>
      )}
    </div>
  );
}
