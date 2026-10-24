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
    <section id="how-it-works" className="relative border-b border-hairline bg-surface/30 py-20 sm:py-28">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="font-mono text-xs font-semibold tracking-wider uppercase text-azure mb-3 block">
                THREE STEPS TO GET RUNNING
              </span>
              <h2 className="text-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text">
                {t("title")}
              </h2>
            </div>

            <Link
              href={`/${locale}/docs/getting-started/install`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-azure-text hover:underline group shrink-0"
            >
              <span>{t("cta")}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {/* 3 Numbered Steps with Connecting Hairline */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {/* Desktop Connecting Hairline behind cards */}
          <div className="hidden md:block absolute top-1/4 left-16 right-16 h-[1px] bg-gradient-to-r from-hairline via-azure/40 to-hairline -z-0" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.step} delay={index * 0.15}>
                <div className="relative z-10 rounded-lg border border-hairline bg-surface p-6 sm:p-8 flex flex-col justify-between h-full hover:border-azure/40 transition-colors group">
                  <div>
                    {/* Header: Step Number & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-3xl sm:text-4xl font-extrabold text-muted/30 group-hover:text-azure/60 transition-colors">
                        {item.step}
                      </span>
                      <div className="size-10 rounded-md bg-azure/10 border border-azure/20 flex items-center justify-center text-azure group-hover:scale-110 transition-transform">
                        <Icon className="size-5" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-text mb-3 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-muted text-sm leading-relaxed mb-6">
                      {item.body}
                    </p>
                  </div>

                  {/* Badge */}
                  <div className="pt-4 border-t border-hairline/60 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-azure bg-azure/10 px-2 py-0.5 rounded border border-azure/20 font-semibold">
                      {item.badge}
                    </span>
                    <CheckCircle2 className="size-4 text-muted/40 group-hover:text-primary transition-colors" />
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
