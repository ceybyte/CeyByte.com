"use client";

import { useTranslations } from "next-intl";
import { Crosshair } from "@/components/brand/crosshair";
import { Reveal } from "@/components/motion/reveal";
import { HardwareCard } from "./bento/hardware-card";
import { KeyboardCard } from "./bento/keyboard-card";
import { OfflineCard } from "./bento/offline-card";
import { ReceiptCard } from "./bento/receipt-card";
import { TaxCard } from "./bento/tax-card";
import { WeighingCard } from "./bento/weighing-card";

export function BentoGrid() {
  const t = useTranslations("home.solution");

  return (
    <section id="features" className="border-hairline bg-surface/10 relative border-b py-20 sm:py-24">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-12 max-w-3xl sm:mb-16">
            <span className="text-azure mb-3 block font-mono text-xs font-semibold tracking-wider uppercase">
              BUILT FOR SRI LANKAN RETAIL COUNTERS
            </span>
            <h2 className="text-display text-text text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        {/* 3×3 Bento Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Row 1: Keyboard (2 cols) + Offline (1 col) */}
          <div className="lg:col-span-2">
            <Reveal delay={0.05}>
              <KeyboardCard className="h-full" />
            </Reveal>
          </div>
          <div className="lg:col-span-1">
            <Reveal delay={0.1}>
              <OfflineCard className="h-full" />
            </Reveal>
          </div>

          {/* Row 2: Hardware (1 col) + Dual-Tax (2 cols) */}
          <div className="lg:col-span-1">
            <Reveal delay={0.15}>
              <HardwareCard className="h-full" />
            </Reveal>
          </div>
          <div className="lg:col-span-2">
            <Reveal delay={0.2}>
              <TaxCard className="h-full" />
            </Reveal>
          </div>

          {/* Row 3: Receipts (1 col) + Weighing & Backups (2 cols) */}
          <div className="lg:col-span-1">
            <Reveal delay={0.25}>
              <ReceiptCard className="h-full" />
            </Reveal>
          </div>
          <div className="lg:col-span-2">
            <Reveal delay={0.3}>
              <WeighingCard className="h-full" />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
