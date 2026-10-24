"use client";

import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    <section className="border-hairline bg-surface/20 relative border-b py-20 sm:py-28">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

      {/* SEO Schema.org FAQPage Rich Snippet */}
      <JsonLd schema={faqSchema(faqItems)} />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-azure mb-3 block font-mono text-xs font-semibold tracking-wider uppercase">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-display text-text text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border-hairline bg-surface rounded-lg border p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-hairline/80 border-b py-2">
                  <AccordionTrigger className="text-text hover:text-azure-text py-4 text-base font-semibold transition-colors hover:no-underline sm:text-lg">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted pb-4 text-sm leading-relaxed sm:text-base">
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
