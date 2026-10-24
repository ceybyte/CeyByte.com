"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
import { taxFromMrp } from "@cbpos/shared/tax";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatRupees(cents: number): string {
  const rs = (cents / 100).toFixed(2);
  const [whole, frac] = rs.split(".");
  const formattedWhole = (whole ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs. ${formattedWhole}.${frac}`;
}

export function TaxCard({ className }: { className?: string }) {
  const t = useTranslations("home.bento.tax");
  const inputId = useId();

  // Default MRP 1,180.00 per PRD [C1] [C2]
  const [mrpInput, setMrpInput] = useState<string>("1180.00");

  const parseMrpCents = (val: string): number => {
    const clean = val.replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  };

  const mrpCents = parseMrpCents(mrpInput);
  let breakdown = { mrpCents: 118000, baseCents: 100000, vatCents: 18000, ssclCents: 1250 };
  try {
    breakdown = taxFromMrp(mrpCents);
  } catch {
    // Graceful fallback on input edge cases
  }

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
            <Calculator className="size-5" />
          </div>
          <span className="font-mono text-[11px] text-muted">ROUND-HALF-EVEN MATH [C1] [C2]</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
          {t("title")}
        </h3>

        <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
          {t("body")}
        </p>
      </div>

      {/* Interactive Calculator Module */}
      <div className="mt-4 pt-4 border-t border-hairline bg-surface-elevated/40 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-lg space-y-4">
        {/* MRP Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor={inputId} className="text-xs font-mono text-muted">
              {t("inputLabel")} (SHELF PRICE IN RUPEES)
            </Label>
            <span className="text-[10px] font-mono text-azure">CUSTOMER PAYS EXACT MRP</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">
              Rs.
            </span>
            <Input
              id={inputId}
              type="text"
              value={mrpInput}
              onChange={(e) => setMrpInput(e.target.value)}
              className="pl-10 font-mono text-base font-bold bg-[#090a0f] border-hairline text-text focus-visible:ring-azure/50"
              placeholder="1,180.00"
            />
          </div>
        </div>

        {/* Calculation Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded border border-hairline bg-[#090a0f] p-3 font-mono">
            <span className="text-[10px] text-muted block mb-1">{t("base")}</span>
            <span className="text-sm font-bold text-text">{formatRupees(breakdown.baseCents)}</span>
          </div>

          <div className="rounded border border-hairline bg-[#090a0f] p-3 font-mono">
            <span className="text-[10px] text-muted block mb-1">{t("vat")}</span>
            <span className="text-sm font-bold text-azure-text">{formatRupees(breakdown.vatCents)}</span>
          </div>

          <div className="rounded border border-hairline bg-[#090a0f] p-3 font-mono">
            <span className="text-[10px] text-muted block mb-1">{t("sscl")}</span>
            <span className="text-sm font-bold text-primary">{formatRupees(breakdown.ssclCents)}</span>
          </div>
        </div>

        {/* Formula & IRD Disclaimer Note */}
        <div className="space-y-1 text-[11px] font-mono text-muted/80 pt-1">
          <p className="text-muted/60 text-[10px]">{t("formula")}</p>
          <p className="text-[10px] text-muted/70 italic">{t("note")}</p>
        </div>
      </div>
    </div>
  );
}
