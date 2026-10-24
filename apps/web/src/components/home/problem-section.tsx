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
    <section className="border-hairline bg-surface/20 relative border-b py-20 sm:py-24">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12 max-w-2xl sm:mb-16">
            <span className="text-error mb-3 block font-mono text-xs font-semibold tracking-wider uppercase">
              THE PROBLEMS WITH TRADITIONAL POS
            </span>
            <h2 className="text-display text-text text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <Reveal key={prob.id} delay={idx * 0.1}>
                <div className="border-hairline bg-surface group hover:border-hairline-elevated relative flex h-full flex-col justify-between overflow-hidden rounded-lg border p-6 transition-colors sm:p-8">
                  {/* 1px Error Fault Line Accent across top (03-DESIGN §9.4) */}
                  <div className="via-error absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

                  <div>
                    <div className="bg-error/10 border-error/20 text-error mb-6 flex size-12 items-center justify-center rounded-md border transition-transform group-hover:scale-105">
                      <Icon className="size-6" />
                    </div>

                    <h3 className="text-text mb-3 text-lg leading-snug font-bold sm:text-xl">{prob.title}</h3>

                    <p className="text-muted text-sm leading-relaxed sm:text-base">{prob.body}</p>
                  </div>

                  <div className="border-hairline/60 text-muted/60 mt-6 flex items-center justify-between border-t pt-6 font-mono text-xs">
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
