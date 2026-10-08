import * as React from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * shadcn-style Accordion built on native <details>/<summary>.
 * Answers live in the server-rendered HTML (good for SEO + FAQPage JSON-LD) and the
 * accordion works with JavaScript disabled — keyboard and screen-reader support is native.
 */

function Accordion({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="accordion"
      className={cn(
        "divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface",
        className,
      )}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: React.ComponentProps<"details">) {
  return <details data-slot="accordion-item" className={cn("group", className)} {...props} />;
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<"summary">) {
  return (
    <summary
      data-slot="accordion-trigger"
      className={cn(
        "flex min-h-16 list-none items-center justify-between gap-6 px-5 py-5 text-left text-base font-semibold transition-colors hover:text-primary-ink md:px-7 md:text-lg [&::-webkit-details-marker]:hidden",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-full border border-border-strong transition-[transform,background-color,color,border-color] duration-300 group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-iron"
      >
        <Plus className="size-4" />
      </span>
    </summary>
  );
}

function AccordionContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="accordion-content"
      className={cn("faq-content px-5 pb-6 leading-relaxed text-muted md:px-7", className)}
      {...props}
    />
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
