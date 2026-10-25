"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crosshair } from "@/components/brand/crosshair";
import { Figure } from "@/components/brand/figure";
import { Reveal } from "@/components/motion/reveal";

import { useGate } from "@/components/gate/gate-context";

export type HeroSectionProps = {
  version?: string;
  sizeMb?: number;
};

export function HeroSection({ version = "1.3.0", sizeMb = 64 }: HeroSectionProps) {
  const t = useTranslations("home.hero");
  const locale = useLocale();
  const { openGate } = useGate();

  return (
    <section className="border-hairline bg-surface/50 relative overflow-hidden border-b py-16 sm:py-24 md:py-28">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Copy Column (Desktop: cols 1–6) */}
          <div className="z-10 flex flex-col justify-center lg:col-span-6">
            <Reveal>
              <div className="mb-6 inline-flex items-center gap-2">
                <span className="bg-azure size-2 animate-pulse rounded-full" />
                <span className="text-muted font-mono text-xs font-semibold tracking-wider uppercase">
                  FREE WINDOWS POS · SRI LANKA
                </span>
              </div>

              <h1 className="text-display text-text mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                {t("title")}
              </h1>

              <p className="text-muted mb-8 max-w-xl text-base leading-relaxed sm:text-lg lg:text-xl">
                {t("lead")}
              </p>

              {/* CTAs */}
              <div className="mb-4 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <Button
                  asChild
                  variant="primary"
                  size="xl"
                  id="hero-cta"
                  className="shadow-lg transition-all duration-300 hover:brightness-105"
                >
                  <a
                    href={`/${locale}/download`}
                    onClick={(e) => {
                      e.preventDefault();
                      openGate();
                    }}
                  >
                    <Download className="mr-1 size-5" />
                    <span>{t("cta")}</span>
                  </a>
                </Button>

                <Button asChild variant="ghost" size="lg">
                  <a
                    href="#how-it-works"
                    className="group text-text hover:text-azure-text inline-flex items-center gap-2"
                  >
                    <span>{t("secondary")}</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>

              {/* Release Metadata */}
              <p className="text-muted mb-8 font-mono text-xs">{t("ctaMeta", { version, sizeMb })}</p>

              {/* 3 Check Assurances */}
              <div className="border-hairline/80 grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 border-primary/30 flex size-5 shrink-0 items-center justify-center rounded-full border">
                    <Check className="text-primary size-3 stroke-[3]" />
                  </div>
                  <span className="text-text text-xs font-medium">{t("assurance.1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 border-primary/30 flex size-5 shrink-0 items-center justify-center rounded-full border">
                    <Check className="text-primary size-3 stroke-[3]" />
                  </div>
                  <span className="text-text text-xs font-medium">{t("assurance.2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 border-primary/30 flex size-5 shrink-0 items-center justify-center rounded-full border">
                    <Check className="text-primary size-3 stroke-[3]" />
                  </div>
                  <span className="text-text text-xs font-medium">{t("assurance.3")}</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Mockup Column (Desktop: cols 7–12) */}
          <div className="relative flex items-center justify-center lg:col-span-6">
            {/* Hairline Keyboard Figure in Background */}
            <div className="pointer-events-none absolute -top-12 -right-10 z-0 scale-110 opacity-20 sm:scale-125 sm:opacity-30">
              <Figure name="keyboard" intensity={0.5} className="w-[420px] sm:w-[540px]" />
            </div>

            {/* Sales Counter Screen Capture Frame with Azure Rim Glow */}
            <Reveal delay={0.15}>
              <div
                role="img"
                aria-label={t("mockupAlt")}
                className="border-azure/40 bg-canvas hover:border-azure relative z-10 w-full max-w-lg overflow-hidden rounded-lg border p-1 shadow-2xl transition-all duration-500 lg:max-w-none"
              >
                <div aria-hidden="true">
                  {/* Frame Header with Rim Glow */}
                  <div className="bg-surface-elevated border-hairline flex items-center justify-between border-b px-3 py-2 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary size-2 rounded-full" />
                      <span className="text-azure-text font-semibold">CB POS v{version}</span>
                      <span className="text-muted hidden sm:inline">· Till 01</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary border-primary/20 rounded border px-1.5 py-0.5 text-[10px]">
                        OFFLINE READY
                      </span>
                      <span className="text-muted/60 font-mono text-[10px] uppercase">
                        {t("mockupLabel")}
                      </span>
                    </div>
                  </div>

                  {/* Simulated Real Sales Screen Contents (PRD §F-02, 06 §3.1) */}
                  <div className="space-y-4 p-4 font-mono text-xs sm:p-5">
                    {/* Cart Header */}
                    <div className="text-muted/70 border-hairline grid grid-cols-12 border-b pb-2 text-[11px]">
                      <span className="col-span-6">ITEM / DESCRIPTION</span>
                      <span className="col-span-2 text-right">QTY/WT</span>
                      <span className="col-span-2 text-right">PRICE</span>
                      <span className="col-span-2 text-right">TOTAL</span>
                    </div>

                    {/* Cart Rows */}
                    <div className="space-y-2.5">
                      <div className="text-text grid grid-cols-12 items-center">
                        <span className="col-span-6 truncate font-medium text-white">Samba Rice (Keeri)</span>
                        <span className="text-azure col-span-2 text-right">1.250 kg</span>
                        <span className="text-muted col-span-2 text-right">260.00</span>
                        <span className="col-span-2 text-right font-semibold">325.00</span>
                      </div>

                      <div className="text-text grid grid-cols-12 items-center">
                        <span className="col-span-6 truncate font-medium text-white">
                          Anchor Milk Powder 400g
                        </span>
                        <span className="text-azure col-span-2 text-right">1 pcs</span>
                        <span className="text-muted col-span-2 text-right">1,050.00</span>
                        <span className="col-span-2 text-right font-semibold">1,050.00</span>
                      </div>

                      <div className="text-text grid grid-cols-12 items-center">
                        <span className="col-span-6 truncate font-medium text-white">
                          Munchee Super Cream Cracker
                        </span>
                        <span className="text-azure col-span-2 text-right">2 pcs</span>
                        <span className="text-muted col-span-2 text-right">190.00</span>
                        <span className="col-span-2 text-right font-semibold">380.00</span>
                      </div>
                    </div>

                    {/* Bill Summary Strip */}
                    <div className="border-hairline/80 space-y-1.5 border-t pt-3">
                      <div className="text-muted flex justify-between text-[11px]">
                        <span>Subtotal before VAT:</span>
                        <span>Rs. 1,487.29</span>
                      </div>
                      <div className="text-muted flex justify-between text-[11px]">
                        <span>VAT (18%) + SSCL (2.5%):</span>
                        <span>Rs. 267.71</span>
                      </div>
                      <div className="text-primary border-hairline/50 flex justify-between border-t pt-1 text-sm font-bold sm:text-base">
                        <span>TOTAL (LKR):</span>
                        <span className="text-lg">Rs. 1,755.00</span>
                      </div>
                    </div>

                    {/* Keyboard Shortcuts Hint Bar */}
                    <div className="text-text border-hairline/60 flex flex-wrap items-center justify-between gap-1 border-t pt-2 text-[10px]">
                      <span>[F3] Find</span>
                      <span>[Enter] Add</span>
                      <span>[F5] Pay</span>
                      <span>[F12] Exact Cash</span>
                      <span>[Esc] Clear</span>
                    </div>
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
