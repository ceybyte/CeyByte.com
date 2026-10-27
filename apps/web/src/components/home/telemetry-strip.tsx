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
    <section className="border-hairline bg-surface/30 relative border-b">
      {/* Structural Crosshairs */}
      <Crosshair className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Crosshair className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Crosshair className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="divide-hairline grid grid-cols-1 divide-y md:grid-cols-2 md:divide-y-0 lg:grid-cols-12 lg:divide-x">
            {/* Stat 1: Offline SQLite */}
            <div className="lg:col-span-2">
              <StatTile
                badge={t("stats.tagArchitecture")}
                value={0}
                format={() => t("stats.lag")}
                label={t("stats.lagLabel")}
                className="h-full justify-between"
              />
            </div>

            {/* Stat 2: Rs. 0 / mo */}
            <div className="lg:col-span-2">
              <StatTile
                badge={t("stats.tagPricing")}
                value={0}
                format={() => t("stats.price")}
                label={t("stats.priceLabel")}
                className="h-full justify-between"
              />
            </div>

            {/* Stat 3: {covered}/25 */}
            <div className="lg:col-span-2">
              <StatTile
                badge={t("stats.tagCoverage")}
                value={isLoading ? null : covered}
                format={(n) => t("stats.districts", { covered: n })}
                label={t("stats.districtsLabel")}
                className="h-full justify-between"
              />
            </div>

            {/* Stat 4: 18% + 2.5% */}
            <div className="lg:col-span-3">
              <div className="flex h-full flex-col justify-between">
                <StatTile
                  badge={t("stats.tagTax")}
                  value={18}
                  format={() => t("stats.tax")}
                  label={t("stats.taxLabel")}
                  className="pb-2"
                />
                <p className="text-muted/70 px-5 pb-4 text-[11px] italic">{t("stats.taxNote")}</p>
              </div>
            </div>

            {/* Map Teaser Card (linking to /{locale}/map) */}
            <div className="bg-surface-elevated/40 hover:bg-surface-elevated/70 group flex flex-col justify-between p-4 transition-colors sm:p-5 lg:col-span-3">
              <Link href={`/${locale}/map`} className="flex h-full flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted/80 font-mono text-[10px] font-semibold tracking-wider uppercase">
                    {t("mapTeaser.badge")}
                  </span>
                  <div className="text-azure flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="bg-azure size-1.5 animate-pulse rounded-full" />
                    <span>LIVE DIRECTORY</span>
                  </div>
                </div>

                <div className="border-hairline bg-canvas relative aspect-[4/2.2] w-full overflow-hidden rounded-[--radius-sm] border">
                  <Image
                    src="/map-teaser.png"
                    alt="Sri Lanka Merchant Telemetry Map Preview"
                    fill
                    className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                  <div className="from-canvas/80 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
                  <div className="text-text/80 absolute bottom-2 left-2 font-mono text-[10px]">
                    25 SRI LANKAN DISTRICTS
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div>
                    <p className="text-text group-hover:text-azure-text text-xs font-semibold transition-colors">
                      {shops === 0 && !isLoading
                        ? t("mapTeaser.empty")
                        : t("mapTeaser.title", { shops, covered })}
                    </p>
                    <span className="text-muted text-[11px] group-hover:underline">{t("mapTeaser.cta")}</span>
                  </div>
                  <div className="border-hairline text-muted group-hover:text-azure-text group-hover:border-azure/40 flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors">
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
