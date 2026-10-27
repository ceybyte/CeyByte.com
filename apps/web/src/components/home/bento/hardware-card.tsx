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
        "border-hairline bg-surface group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-colors sm:p-8",
        className,
      )}
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="bg-azure/10 border-azure/20 text-azure flex size-10 items-center justify-center rounded-[--radius-sm] border">
            <Cpu className="size-5" />
          </div>
          <span className="text-muted font-mono text-[11px] font-semibold tracking-wider">
            PLUG & PLAY HARDWARE
          </span>
        </div>

        <h3 className="text-text mb-3 text-xl font-bold sm:text-2xl">{t("title")}</h3>

        <p className="text-muted mb-6 text-sm leading-relaxed sm:text-base">{t("body")}</p>
      </div>

      {/* Hardware Status Grid */}
      <div className="border-hairline bg-surface-elevated/40 -mx-6 mt-4 -mb-6 space-y-2.5 rounded-b-[--radius-md] border-t p-6 pt-4 sm:-mx-8 sm:-mb-8 sm:p-8">
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <div
              key={device.name}
              className="border-hairline bg-canvas flex items-center justify-between rounded-[--radius-sm] border p-2.5 font-mono text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="text-azure size-4 shrink-0" />
                <div>
                  <p className="text-text text-[11px] leading-tight font-semibold">{device.name}</p>
                  <p className="text-muted/60 text-[10px] leading-tight">{device.detail}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 pl-2">
                <span className="bg-azure size-1.5 animate-pulse rounded-full" />
                <span className="text-azure-text text-[10px] font-semibold tracking-wider">
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
