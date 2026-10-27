"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Crosshair } from "@/components/brand/crosshair";
import { Reveal } from "@/components/motion/reveal";
import { useStats } from "@/lib/use-stats";

export function TelemetryStrip() {
  const t = useTranslations("home");
  const locale = useLocale();
  const { stats, isLoading } = useStats();

  const covered = stats?.districtsCovered ?? 0;
  const shops = stats?.listedShops ?? 0;

  return (
    <section className="border-hairline/80 bg-canvas relative border-b py-6 sm:py-8">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="border-hairline bg-surface/90 rounded-2xl border p-5 shadow-2xl backdrop-blur-md">
            <div className="divide-hairline/80 grid grid-cols-2 gap-6 divide-y sm:divide-x sm:divide-y-0 md:grid-cols-4 lg:grid-cols-5">
              {/* Item 1: Local Cashiering */}
              <div className="px-3">
                <span className="text-muted font-mono text-[10px] font-semibold uppercase">
                  {t("stats.tagArchitecture")}
                </span>
                <div className="text-text mt-1 font-mono text-2xl font-bold">{t("stats.lag")}</div>
                <p className="text-muted mt-1 text-[11px] leading-snug">{t("stats.lagLabel")}</p>
              </div>

              {/* Item 2: Lifetime License */}
              <div className="px-3 pt-4 sm:pt-0">
                <span className="text-muted font-mono text-[10px] font-semibold uppercase">
                  {t("stats.tagPricing")}
                </span>
                <div className="text-text mt-1 font-mono text-2xl font-bold">{t("stats.price")}</div>
                <p className="text-muted mt-1 text-[11px] leading-snug">{t("stats.priceLabel")}</p>
              </div>

              {/* Item 3: Provincial Reach */}
              <div className="px-3 pt-4 sm:pt-0">
                <span className="text-muted font-mono text-[10px] font-semibold uppercase">
                  {t("stats.tagCoverage")}
                </span>
                <div className="text-text mt-1 font-mono text-2xl font-bold">
                  {isLoading ? "—" : t("stats.districts", { covered })}
                </div>
                <p className="text-muted mt-1 text-[11px] leading-snug">{t("stats.districtsLabel")}</p>
              </div>

              {/* Item 4: Revenue Tax */}
              <div className="px-3 pt-4 sm:pt-0">
                <span className="text-muted font-mono text-[10px] font-semibold uppercase">
                  {t("stats.tagTax")}
                </span>
                <div className="text-text mt-1 font-mono text-2xl font-bold">{t("stats.tax")}</div>
                <p className="text-muted mt-1 text-[11px] leading-snug">{t("stats.taxLabel")}</p>
              </div>

              {/* Item 5: Live Directory */}
              <div className="col-span-2 flex flex-col justify-between gap-2 px-3 pt-4 sm:pt-0 md:col-span-4 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-azure-text flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                    <span className="bg-azure size-1.5 animate-pulse rounded-full" />
                    LIVE DIRECTORY
                  </span>
                  <span className="text-muted font-mono text-[10px]">
                    {shops > 0 ? `${shops} shops` : "25 districts"}
                  </span>
                </div>
                <Link
                  href={`/${locale}/map`}
                  className="bg-azure hover:bg-azure-hover text-primary-foreground flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold shadow-sm transition-colors"
                >
                  <span>{t("mapTeaser.cta")}</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
