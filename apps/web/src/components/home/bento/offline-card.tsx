"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Database, Wifi, WifiOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function OfflineCard({ className }: { className?: string }) {
  const t = useTranslations("home.bento.offline");
  // Default is Wi-Fi OFF (proving offline-first nature, PRD §F-02)
  const [wifiOn, setWifiOn] = useState<boolean>(false);

  return (
    <div
      className={cn(
        "border-hairline bg-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-colors sm:p-8",
        className,
      )}
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="bg-azure/10 border-azure/20 text-azure flex size-10 items-center justify-center rounded-[--radius-sm] border">
            <Database className="size-5" />
          </div>
          <span className="text-muted font-mono text-[11px] font-semibold tracking-wider">
            OFFLINE SQLITE ENGINE
          </span>
        </div>

        <h3 className="text-text mb-3 text-xl font-bold sm:text-2xl">{t("title")}</h3>

        <p className="text-muted mb-6 text-sm leading-relaxed sm:text-base">{t("body")}</p>
      </div>

      {/* Interactive Wi-Fi Switcher Module */}
      <div className="border-hairline bg-surface-elevated/40 -mx-6 mt-4 -mb-6 space-y-4 rounded-b-[--radius-md] border-t p-6 pt-4 sm:-mx-8 sm:-mb-8 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {wifiOn ? <Wifi className="text-azure size-4" /> : <WifiOff className="text-azure-text size-4" />}
            <span className="text-text text-xs font-semibold">{wifiOn ? t("toggleOn") : t("toggleOff")}</span>
          </div>

          <Switch checked={wifiOn} onCheckedChange={setWifiOn} aria-label="Toggle network connectivity" />
        </div>

        {/* Live Status Indicator Box */}
        <div className="border-hairline bg-canvas space-y-2 rounded-[--radius-sm] border p-3.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted text-[11px]">WRITE LATENCY:</span>
            <span className="text-azure-text font-bold">~0.4 ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted text-[11px]">STORAGE ENGINE:</span>
            <span className="text-text">SQLite 3 (WAL mode)</span>
          </div>
          <div className="border-hairline/60 flex items-center gap-2 border-t pt-1">
            <span
              className={cn("size-2 rounded-full", wifiOn ? "bg-azure" : "bg-azure-text animate-pulse")}
            />
            <span className={cn("text-[11px]", wifiOn ? "text-azure" : "text-azure-text font-semibold")}>
              {wifiOn ? "Sync ready · Local billing unaffected" : "OFFLINE-READY · NO NETWORK BLOCKS"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
