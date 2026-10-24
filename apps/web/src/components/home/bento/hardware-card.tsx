"use client";

import { useTranslations } from "next-intl";
import { Cpu, Printer, QrCode, Scale, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function HardwareCard({ className }: { className?: string }) {
  const t = useTranslations("home.bento.hardware");

  const devices = [
    {
      name: "ESC/POS Thermal Printer",
      detail: "58mm / 80mm USB & Port 9100",
      status: "READY",
      icon: Printer,
    },
    {
      name: "Barcode Scanner",
      detail: "Keyboard-wedge USB HID",
      status: "READY",
      icon: QrCode,
    },
    {
      name: "Cash Drawer",
      detail: "RJ11 via printer DK port (24V)",
      status: "ARMED",
      icon: Wallet,
    },
    {
      name: "Price/Weight Scale",
      detail: "EAN-13 in-store label parser",
      status: "ACTIVE",
      icon: Scale,
    },
  ];

  return (
    <div
      className={cn(
        "relative rounded-lg border border-hairline bg-surface p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-colors group",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="size-10 rounded-md bg-azure/10 border border-azure/20 flex items-center justify-center text-azure">
            <Cpu className="size-5" />
          </div>
          <span className="font-mono text-[11px] text-muted">UNIVERSAL HARDWARE [E1] [E4]</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
          {t("title")}
        </h3>

        <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
          {t("body")}
        </p>
      </div>

      {/* Hardware Status Grid */}
      <div className="mt-4 pt-4 border-t border-hairline bg-surface-elevated/40 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-lg space-y-2.5">
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <div
              key={device.name}
              className="flex items-center justify-between p-2.5 rounded border border-hairline bg-[#090a0f] text-xs font-mono"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="size-4 text-azure shrink-0" />
                <div>
                  <p className="font-semibold text-text text-[11px] leading-tight">{device.name}</p>
                  <p className="text-muted/60 text-[10px] leading-tight">{device.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary font-semibold tracking-wider">
                  {device.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
