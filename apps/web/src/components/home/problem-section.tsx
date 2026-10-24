"use client";

import { useTranslations } from "next-intl";
import { Calculator, Repeat, WifiOff } from "lucide-react";
import { Crosshair } from "@/components/brand/crosshair";
import { Reveal } from "@/components/motion/reveal";

export function ProblemSection() {
  const t = useTranslations("home.problem");

  const problems = [
    {
      id: "1",
      icon: WifiOff,
      title: t("1.title"),
      body: t("1.body"),
    },
    {
      id: "2",
      icon: Repeat,
      title: t("2.title"),
      body: t("2.body"),
    },
    {
      id: "3",
      icon: Calculator,
      title: t("3.title"),
      body: t("3.body"),
    },
  ];

  return (
    <section className="relative border-b border-hairline bg-surface/20 py-20 sm:py-24">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Reveal>
          <div className="max-w-2xl mb-12 sm:mb-16">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-error mb-3 block">
              THE PROBLEMS WITH TRADITIONAL POS
            </span>
            <h2 className="text-display text-3xl sm:text-4xl font-bold tracking-tight text-text">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <Reveal key={prob.id} delay={idx * 0.1}>
                <div className="relative h-full rounded-lg border border-hairline bg-surface p-6 sm:p-8 flex flex-col justify-between overflow-hidden group hover:border-hairline-elevated transition-colors">
                  {/* 1px Error Fault Line Accent across top (03-DESIGN §9.4) */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-error to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                  <div>
                    <div className="size-12 rounded-md bg-error/10 border border-error/20 flex items-center justify-center text-error mb-6 group-hover:scale-105 transition-transform">
                      <Icon className="size-6" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-text mb-3 leading-snug">
                      {prob.title}
                    </h3>

                    <p className="text-muted text-sm sm:text-base leading-relaxed">
                      {prob.body}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-hairline/60 flex items-center justify-between text-xs font-mono text-muted/60">
                    <span>CASE 0{idx + 1}</span>
                    <span className="text-error/80">AVOIDABLE LOSS</span>
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
