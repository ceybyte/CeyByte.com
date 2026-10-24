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
        "relative rounded-lg border border-hairline bg-surface p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-colors group",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="size-10 rounded-md bg-azure/10 border border-azure/20 flex items-center justify-center text-azure">
            <Scale className="size-5" />
          </div>
          <span className="font-mono text-[11px] text-muted">EAN-13 SCALE PARSER & ENCRYPTED BACKUPS [D2] [G2]</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
          {t("title")}
        </h3>

        <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
          {t("body")}
        </p>
      </div>

      {/* Interactive Scale Parser & USB Encryption Module */}
      <div className="mt-4 pt-4 border-t border-hairline bg-surface-elevated/40 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-lg space-y-4">
        {/* Barcode Selector & Dissector */}
        <div className="rounded border border-hairline bg-[#090a0f] p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-[11px] text-muted pb-1 border-b border-hairline/40">
            <span className="flex items-center gap-1.5 text-azure">
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
                    "px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors",
                    selectedBarcodeIndex === idx
                      ? "bg-azure text-inverse font-bold"
                      : "bg-[#18181B] text-muted hover:text-text"
                  )}
                >
                  Item 0{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Barcode Dissection Graphic */}
          <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-1">
            <div className="p-2 rounded bg-[#131822] border border-hairline">
              <span className="text-[10px] text-muted block mb-0.5">PREFIX</span>
              <span className="font-bold text-azure">20</span>
              <span className="text-[9px] text-muted/60 block mt-0.5">Weighed Item</span>
            </div>

            <div className="p-2 rounded bg-[#131822] border border-hairline">
              <span className="text-[10px] text-muted block mb-0.5">PLU CODE</span>
              <span className="font-bold text-text">{current.plu}</span>
              <span className="text-[9px] text-muted/60 block mt-0.5 truncate">{current.name}</span>
            </div>

            <div className="p-2 rounded bg-primary/10 border border-primary/30">
              <span className="text-[10px] text-muted block mb-0.5">WEIGHT</span>
              <span className="font-bold text-primary">{current.weight}</span>
              <span className="text-[9px] text-primary/80 block mt-0.5">3 Decimals</span>
            </div>

            <div className="p-2 rounded bg-[#131822] border border-hairline">
              <span className="text-[10px] text-muted block mb-0.5">BILL LINE</span>
              <span className="font-bold text-white">{current.price}</span>
              <span className="text-[9px] text-muted/60 block mt-0.5">Exact Total</span>
            </div>
          </div>
        </div>

        {/* AES Encrypted USB Backup Assurance Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded border border-hairline bg-[#090a0f] text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Lock className="size-3.5" />
            </div>
            <div>
              <p className="font-semibold text-text text-[11px]">AES-256 ENCRYPTED .ZIP BACKUPS</p>
              <p className="text-muted/60 text-[10px]">Zero cloud exposure · You hold the backup key on your USB drive</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-primary text-[10px] font-semibold">
            <ShieldCheck className="size-3.5" />
            <span>PROTECTED [G2]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
