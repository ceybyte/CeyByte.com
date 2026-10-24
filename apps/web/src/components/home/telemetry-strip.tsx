"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Crosshair } from "@/components/brand/crosshair";
import { StatTile } from "@/components/brand/stat-tile";
import { Reveal } from "@/components/motion/reveal";
import { useStats } from "@/lib/use-stats";

export function TelemetryStrip() {
  const t = useTranslations("home");
  const locale = useLocale();
  const { stats, isLoading } = useStats();

  const covered = stats?.districtsCovered ?? 0;
  const shops = stats?.listedShops ?? 0;

  return (
    <section className="relative border-b border-hairline bg-surface/30">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="bottom-0 right-0 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 divide-y md:divide-y-0 lg:divide-x divide-hairline">
            {/* Stat 1: 0 ms */}
            <div className="lg:col-span-2">
              <StatTile
                value={0}
                format={() => t("stats.lag")}
                label={t("stats.lagLabel")}
                className="h-full justify-between"
              />
            </div>

            {/* Stat 2: Rs. 0 / mo */}
            <div className="lg:col-span-2">
              <StatTile
                value={0}
                format={() => t("stats.price")}
                label={t("stats.priceLabel")}
                className="h-full justify-between"
              />
            </div>

            {/* Stat 3: {covered}/25 */}
            <div className="lg:col-span-2">
              <StatTile
                value={isLoading ? null : covered}
                format={(n) => t("stats.districts", { covered: n })}
                label={t("stats.districtsLabel")}
                className="h-full justify-between"
              />
            </div>

            {/* Stat 4: 18% + 2.5% */}
            <div className="lg:col-span-3">
              <div className="h-full flex flex-col justify-between">
                <StatTile
                  value={18}
                  format={() => t("stats.tax")}
                  label={t("stats.taxLabel")}
                  className="pb-2"
                />
                <p className="px-5 pb-4 text-[11px] text-muted/70 italic">
                  {t("stats.taxNote")}
                </p>
              </div>
            </div>

            {/* Map Teaser Card (linking to /{locale}/map) */}
            <div className="lg:col-span-3 p-4 sm:p-5 flex flex-col justify-between bg-surface-elevated/40 hover:bg-surface-elevated/70 transition-colors group">
              <Link href={`/${locale}/map`} className="flex flex-col h-full justify-between gap-3">
                <div className="relative w-full aspect-[4/2.5] rounded border border-hairline overflow-hidden bg-[#090a0f]">
                  <Image
                    src="/map-teaser.png"
                    alt="Sri Lanka Merchant Telemetry Map Preview"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-azure/10 text-azure border border-azure/30">
                    LIVE MAP
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div>
                    <p className="text-xs font-semibold text-text group-hover:text-azure-text transition-colors">
                      {shops === 0 && !isLoading
                        ? t("mapTeaser.empty")
                        : t("mapTeaser.title", { shops, covered })}
                    </p>
                    <span className="text-[11px] text-muted group-hover:underline">
                      {t("mapTeaser.cta")}
                    </span>
                  </div>
                  <div className="size-8 rounded-full border border-hairline flex items-center justify-center text-muted group-hover:text-azure-text group-hover:border-azure/40 shrink-0 transition-colors">
                    <ArrowUpRight className="size-4" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
