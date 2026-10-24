"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Crosshair } from "@/components/brand/crosshair";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd, faqSchema } from "@/lib/json-ld";

export function FaqSection() {
  const t = useTranslations("home.faq");

  const faqItems = [
    { id: "item-1", q: t("1.q"), a: t("1.a") },
    { id: "item-2", q: t("2.q"), a: t("2.a") },
    { id: "item-3", q: t("3.q"), a: t("3.a") },
    { id: "item-4", q: t("4.q"), a: t("4.a") },
    { id: "item-5", q: t("5.q"), a: t("5.a") },
  ];

  return (
    <section className="relative border-b border-hairline bg-surface/20 py-20 sm:py-28">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />

      {/* SEO Schema.org FAQPage Rich Snippet */}
      <JsonLd schema={faqSchema(faqItems)} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-azure mb-3 block">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-display text-3xl sm:text-4xl font-bold tracking-tight text-text">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-lg border border-hairline bg-surface p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-b border-hairline/80 py-2">
                  <AccordionTrigger className="text-base sm:text-lg font-semibold text-text hover:text-azure-text hover:no-underline transition-colors py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted text-sm sm:text-base leading-relaxed pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
