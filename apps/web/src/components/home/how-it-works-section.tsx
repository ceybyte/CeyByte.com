"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, Download, Play, SlidersHorizontal } from "lucide-react";
import { Crosshair } from "@/components/brand/crosshair";
import { Reveal } from "@/components/motion/reveal";

export function HowItWorksSection({ sizeMb = 64 }: { sizeMb?: number }) {
  const t = useTranslations("home.how");
  const locale = useLocale();

  const steps = [
    {
      step: "01",
      icon: Download,
      title: t("1.title"),
      body: t("1.body", { sizeMb }),
      badge: `~${sizeMb} MB · NO CARD NEEDED`,
    },
    {
      step: "02",
      icon: SlidersHorizontal,
      title: t("2.title"),
      body: t("2.body"),
      badge: "DEFAULT PIN: 1234 [I1]",
    },
    {
      step: "03",
      icon: Play,
      title: t("3.title"),
      body: t("3.body"),
      badge: "F3 FIND · F5 PAY [B1]",
    },
  ];

  return (
    <section id="how-it-works" className="border-hairline bg-surface/30 relative border-b py-20 sm:py-28">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-azure mb-3 block font-mono text-xs font-semibold tracking-wider uppercase">
                THREE STEPS TO GET RUNNING
              </span>
              <h2 className="text-display text-text text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t("title")}
              </h2>
            </div>

            <Link
              href={`/${locale}/docs/getting-started/install`}
              className="text-azure-text group inline-flex shrink-0 items-center gap-2 text-sm font-semibold hover:underline"
            >
              <span>{t("cta")}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {/* 3 Numbered Steps with Connecting Hairline */}
        <div className="relative grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-3">
          {/* Desktop Connecting Hairline behind cards */}
          <div className="from-hairline via-azure/40 to-hairline absolute top-1/4 right-16 left-16 -z-0 hidden h-[1px] bg-gradient-to-r md:block" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.step} delay={index * 0.15}>
                <div className="border-hairline bg-surface hover:border-azure/40 group relative z-10 flex h-full flex-col justify-between rounded-lg border p-6 transition-colors sm:p-8">
                  <div>
                    {/* Header: Step Number & Icon */}
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-muted/30 group-hover:text-azure/60 font-mono text-3xl font-extrabold transition-colors sm:text-4xl">
                        {item.step}
                      </span>
                      <div className="bg-azure/10 border-azure/20 text-azure flex size-10 items-center justify-center rounded-md border transition-transform group-hover:scale-110">
                        <Icon className="size-5" />
                      </div>
                    </div>

                    <h3 className="text-text mb-3 text-xl leading-snug font-bold">{item.title}</h3>

                    <p className="text-muted mb-6 text-sm leading-relaxed">{item.body}</p>
                  </div>

                  {/* Badge */}
                  <div className="border-hairline/60 flex items-center justify-between border-t pt-4">
                    <span className="text-azure bg-azure/10 border-azure/20 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold">
                      {item.badge}
                    </span>
                    <CheckCircle2 className="text-muted/40 group-hover:text-primary size-4 transition-colors" />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
