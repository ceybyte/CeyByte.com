"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Barcode, Lock, Scale, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function WeighingCard({ className }: { className?: string }) {
  const t = useTranslations("home.bento.weigh");

  // Sample scale barcodes with different weights
  const [selectedBarcodeIndex, setSelectedBarcodeIndex] = useState<number>(0);
  const SAMPLES = [
    { code: "200004201250", plu: "00042", name: "Samba Rice", weight: "1.250 kg", price: "Rs. 325.00" },
    { code: "200008802500", plu: "00088", name: "Mysore Dhal", weight: "2.500 kg", price: "Rs. 725.00" },
    { code: "200010500750", plu: "00105", name: "Red Onions", weight: "0.750 kg", price: "Rs. 360.00" },
  ];

  const current = SAMPLES[selectedBarcodeIndex] ?? SAMPLES[0]!;

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
            <Scale className="size-5" />
          </div>
          <span className="text-muted font-mono text-[11px] font-semibold tracking-wider">
            EAN-13 SCALE PARSER & ENCRYPTED BACKUPS
          </span>
        </div>

        <h3 className="text-text mb-3 text-xl font-bold sm:text-2xl">{t("title")}</h3>

        <p className="text-muted mb-6 text-sm leading-relaxed sm:text-base">{t("body")}</p>
      </div>

      {/* Interactive Scale Parser & USB Encryption Module */}
      <div className="border-hairline bg-surface-elevated/40 -mx-6 mt-4 -mb-6 space-y-4 rounded-b-[--radius-md] border-t p-6 pt-4 sm:-mx-8 sm:-mb-8 sm:p-8">
        {/* Barcode Selector & Dissector */}
        <div className="border-hairline bg-canvas space-y-3 rounded-[--radius-sm] border p-4 font-mono text-xs">
          <div className="text-muted border-hairline/40 flex items-center justify-between border-b pb-1 text-[11px]">
            <span className="text-azure flex items-center gap-1.5">
              <Barcode className="size-4" />
              <span>BARCODE SCALE DECODER</span>
            </span>
            <div className="flex gap-1.5">
              {SAMPLES.map((s, idx) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setSelectedBarcodeIndex(idx)}
                  className={cn(
                    "cursor-pointer rounded-[--radius-sm] px-2 py-0.5 text-[10px] transition-colors",
                    selectedBarcodeIndex === idx
                      ? "bg-azure text-inverse font-bold"
                      : "bg-surface-legal text-muted hover:text-text",
                  )}
                >
                  Item 0{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Barcode Dissection Graphic */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center text-[11px]">
            <div className="bg-surface-elevated border-hairline rounded-[--radius-sm] border p-2">
              <span className="text-muted mb-0.5 block text-[10px]">PREFIX</span>
              <span className="text-azure font-bold">20</span>
              <span className="text-muted/60 mt-0.5 block text-[9px]">Weighed Item</span>
            </div>

            <div className="bg-surface-elevated border-hairline rounded-[--radius-sm] border p-2">
              <span className="text-muted mb-0.5 block text-[10px]">PLU CODE</span>
              <span className="text-text font-bold">{current.plu}</span>
              <span className="text-muted/60 mt-0.5 block truncate text-[9px]">{current.name}</span>
            </div>

            <div className="bg-azure/10 border-azure/30 rounded-[--radius-sm] border p-2">
              <span className="text-muted mb-0.5 block text-[10px]">WEIGHT</span>
              <span className="text-azure-text font-bold">{current.weight}</span>
              <span className="text-azure/80 mt-0.5 block text-[9px]">3 Decimals</span>
            </div>

            <div className="bg-surface-elevated border-hairline rounded-[--radius-sm] border p-2">
              <span className="text-muted mb-0.5 block text-[10px]">BILL LINE</span>
              <span className="font-bold text-white">{current.price}</span>
              <span className="text-muted/60 mt-0.5 block text-[9px]">Exact Total</span>
            </div>
          </div>
        </div>

        {/* AES Encrypted USB Backup Assurance Strip */}
        <div className="border-hairline bg-canvas flex flex-col items-start justify-between gap-3 rounded-[--radius-sm] border p-3 font-mono text-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="bg-azure/10 border-azure/20 text-azure flex size-6 items-center justify-center rounded-[--radius-sm] border">
              <Lock className="size-3.5" />
            </div>
            <div>
              <p className="text-text text-[11px] font-semibold">AES-256 ENCRYPTED .ZIP BACKUPS</p>
              <p className="text-muted/60 text-[10px]">
                Zero cloud exposure · You hold the backup key on your USB drive
              </p>
            </div>
          </div>
          <div className="text-azure-text flex items-center gap-1.5 text-[10px] font-semibold">
            <ShieldCheck className="size-3.5" />
            <span>AES-ENCRYPTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
