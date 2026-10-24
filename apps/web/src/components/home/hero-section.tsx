"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crosshair } from "@/components/brand/crosshair";
import { Figure } from "@/components/brand/figure";
import { Reveal } from "@/components/motion/reveal";

export type HeroSectionProps = {
  version?: string;
  sizeMb?: number;
};

export function HeroSection({ version = "1.3.0", sizeMb = 64 }: HeroSectionProps) {
  const t = useTranslations("home.hero");
  const locale = useLocale();

  return (
    <section className="relative border-b border-hairline bg-surface/50 overflow-hidden py-16 sm:py-24 md:py-28">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Copy Column (Desktop: cols 1–6) */}
          <div className="lg:col-span-6 flex flex-col justify-center z-10">
            <Reveal>
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="size-2 rounded-full bg-azure animate-pulse" />
                <span className="font-mono text-xs font-semibold tracking-wider uppercase text-muted">
                  FREE WINDOWS POS · SRI LANKA
                </span>
              </div>

              <h1 className="text-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.1] mb-6">
                {t("title")}
              </h1>

              <p className="text-muted text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-xl">
                {t("lead")}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
                <Button
                  asChild
                  variant="primary"
                  size="xl"
                  className="shadow-[0_0_24px_rgba(57,255,20,0.3)] hover:shadow-[0_0_32px_rgba(57,255,20,0.5)] transition-shadow duration-300"
                >
                  <Link href={`/${locale}/download`}>
                    <Download className="size-5 mr-1" />
                    <span>{t("cta")}</span>
                  </Link>
                </Button>

                <Button asChild variant="ghost" size="lg">
                  <a href="#how-it-works" className="inline-flex items-center gap-2 group text-text hover:text-azure-text">
                    <span>{t("secondary")}</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>

              {/* Release Metadata */}
              <p className="font-mono text-xs text-muted/80 mb-8">
                {t("ctaMeta", { version, sizeMb })}
              </p>

              {/* 3 Check Assurances */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-hairline/80">
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <Check className="size-3 text-primary stroke-[3]" />
                  </div>
                  <span className="text-xs font-medium text-text">{t("assurance.1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <Check className="size-3 text-primary stroke-[3]" />
                  </div>
                  <span className="text-xs font-medium text-text">{t("assurance.2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <Check className="size-3 text-primary stroke-[3]" />
                  </div>
                  <span className="text-xs font-medium text-text">{t("assurance.3")}</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Mockup Column (Desktop: cols 7–12) */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Hairline Keyboard Figure in Background */}
            <div className="absolute -top-12 -right-10 pointer-events-none opacity-20 sm:opacity-30 scale-110 sm:scale-125 z-0">
              <Figure name="keyboard" intensity={0.5} className="w-[420px] sm:w-[540px]" />
            </div>

            {/* Sales Counter Screen Capture Frame with Azure Rim Glow */}
            <Reveal delay={0.15}>
              <div className="relative z-10 w-full max-w-lg lg:max-w-none rounded-lg border border-hairline bg-[#0d1017] shadow-[0_0_60px_rgba(0,245,255,0.12)] p-1 overflow-hidden transition-all duration-500 hover:shadow-[0_0_80px_rgba(0,245,255,0.2)]">
                {/* Frame Header with Rim Glow */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#131822] border-b border-hairline text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary" />
                    <span className="text-azure-text font-semibold">CB POS v{version}</span>
                    <span className="text-muted hidden sm:inline">· Till 01</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20">
                      OFFLINE READY
                    </span>
                    <span className="text-muted/60 text-[10px] uppercase font-mono">{t("mockupLabel")}</span>
                  </div>
                </div>

                {/* Simulated Real Sales Screen Contents (PRD §F-02, 06 §3.1) */}
                <div className="p-4 sm:p-5 space-y-4 font-mono text-xs">
                  {/* Cart Header */}
                  <div className="grid grid-cols-12 text-muted/70 pb-2 border-b border-hairline text-[11px]">
                    <span className="col-span-6">ITEM / DESCRIPTION</span>
                    <span className="col-span-2 text-right">QTY/WT</span>
                    <span className="col-span-2 text-right">PRICE</span>
                    <span className="col-span-2 text-right">TOTAL</span>
                  </div>

                  {/* Cart Rows */}
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-12 text-text items-center">
                      <span className="col-span-6 font-medium text-white truncate">Samba Rice (Keeri)</span>
                      <span className="col-span-2 text-right text-azure">1.250 kg</span>
                      <span className="col-span-2 text-right text-muted">260.00</span>
                      <span className="col-span-2 text-right font-semibold">325.00</span>
                    </div>

                    <div className="grid grid-cols-12 text-text items-center">
                      <span className="col-span-6 font-medium text-white truncate">Anchor Milk Powder 400g</span>
                      <span className="col-span-2 text-right text-azure">1 pcs</span>
                      <span className="col-span-2 text-right text-muted">1,050.00</span>
                      <span className="col-span-2 text-right font-semibold">1,050.00</span>
                    </div>

                    <div className="grid grid-cols-12 text-text items-center">
                      <span className="col-span-6 font-medium text-white truncate">Munchee Super Cream Cracker</span>
                      <span className="col-span-2 text-right text-azure">2 pcs</span>
                      <span className="col-span-2 text-right text-muted">190.00</span>
                      <span className="col-span-2 text-right font-semibold">380.00</span>
                    </div>
                  </div>

                  {/* Bill Summary Strip */}
                  <div className="pt-3 border-t border-hairline/80 space-y-1.5">
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>Subtotal before VAT:</span>
                      <span>Rs. 1,487.29</span>
                    </div>
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>VAT (18%) + SSCL (2.5%):</span>
                      <span>Rs. 267.71</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base font-bold text-primary pt-1 border-t border-hairline/50">
                      <span>TOTAL (LKR):</span>
                      <span className="text-lg">Rs. 1,755.00</span>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts Hint Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] text-muted/60 border-t border-hairline/60">
                    <span>[F3] Find</span>
                    <span>[Enter] Add</span>
                    <span>[F5] Pay</span>
                    <span>[F12] Exact Cash</span>
                    <span>[Esc] Clear</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
