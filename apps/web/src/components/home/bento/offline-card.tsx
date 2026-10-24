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
        "relative rounded-lg border border-hairline bg-surface p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-colors group",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="size-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Database className="size-5" />
          </div>
          <span className="font-mono text-[11px] text-muted">LOCAL SQLITE [G1]</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
          {t("title")}
        </h3>

        <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
          {t("body")}
        </p>
      </div>

      {/* Interactive Wi-Fi Switcher Module */}
      <div className="mt-4 pt-4 border-t border-hairline bg-surface-elevated/40 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {wifiOn ? (
              <Wifi className="size-4 text-azure" />
            ) : (
              <WifiOff className="size-4 text-primary" />
            )}
            <span className="text-xs font-semibold text-text">
              {wifiOn ? t("toggleOn") : t("toggleOff")}
            </span>
          </div>

          <Switch
            checked={wifiOn}
            onCheckedChange={setWifiOn}
            aria-label="Toggle network connectivity"
          />
        </div>

        {/* Live Status Indicator Box */}
        <div className="rounded border border-hairline bg-[#090a0f] p-3.5 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted text-[11px]">WRITE LATENCY:</span>
            <span className="text-primary font-bold">~0.4 ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted text-[11px]">STORAGE ENGINE:</span>
            <span className="text-text">SQLite 3 (WAL mode)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-hairline/60">
            <span
              className={cn(
                "size-2 rounded-full",
                wifiOn ? "bg-azure" : "bg-primary animate-pulse"
              )}
            />
            <span className={cn("text-[11px]", wifiOn ? "text-azure" : "text-primary font-semibold")}>
              {wifiOn ? "Sync ready · Local billing unaffected" : "100% OFFLINE · NO NETWORK BLOCKS"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
