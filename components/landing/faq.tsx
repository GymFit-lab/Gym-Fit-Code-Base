import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { faqContent as content } from "@/content/landing";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-surface section-y">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <SectionHeading copy={content} id="faq-title" align="left" />
          <Button asChild variant="outline" size="lg" className="mt-8">
            <Link href={content.cta.href}>{content.cta.label}</Link>
          </Button>
        </div>

        <Accordion data-reveal className="bg-bg">
          {content.items.map((item) => (
            <AccordionItem key={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
