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
        "border-hairline bg-surface group relative flex flex-col justify-between overflow-hidden rounded-[--radius-md] border p-6 transition-colors sm:p-8",
        className,
      )}
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="bg-azure/10 border-azure/20 text-azure flex size-10 items-center justify-center rounded-[--radius-sm] border">
            <Calculator className="size-5" />
          </div>
          <span className="text-muted font-mono text-[11px] font-semibold tracking-wider">
            SRI LANKA DUAL-TAX ENGINE
          </span>
        </div>

        <h3 className="text-text mb-3 text-xl font-bold sm:text-2xl">{t("title")}</h3>

        <p className="text-muted mb-6 text-sm leading-relaxed sm:text-base">{t("body")}</p>
      </div>

      {/* Interactive Calculator Module */}
      <div className="border-hairline bg-surface-elevated/40 -mx-6 mt-4 -mb-6 space-y-4 rounded-b-[--radius-md] border-t p-6 pt-4 sm:-mx-8 sm:-mb-8 sm:p-8">
        {/* MRP Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={inputId} className="text-muted font-mono text-xs">
              {t("inputLabel")} (SHELF PRICE IN RUPEES)
            </Label>
            <span className="text-azure font-mono text-[10px]">CUSTOMER PAYS EXACT MRP</span>
          </div>
          <div className="relative">
            <span className="text-muted absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm">Rs.</span>
            <Input
              id={inputId}
              type="text"
              value={mrpInput}
              onChange={(e) => setMrpInput(e.target.value)}
              className="bg-canvas border-hairline text-text focus-visible:ring-azure/50 rounded-[--radius-sm] pl-10 font-mono text-base font-bold"
              placeholder="1,180.00"
            />
          </div>
        </div>

        {/* Calculation Breakdown Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border-hairline bg-canvas rounded-[--radius-sm] border p-3 font-mono">
            <span className="text-muted mb-1 block text-[10px]">{t("base")}</span>
            <span className="text-text text-sm font-bold">{formatRupees(breakdown.baseCents)}</span>
          </div>

          <div className="border-hairline bg-canvas rounded-[--radius-sm] border p-3 font-mono">
            <span className="text-muted mb-1 block text-[10px]">{t("vat")}</span>
            <span className="text-azure-text text-sm font-bold">{formatRupees(breakdown.vatCents)}</span>
          </div>

          <div className="border-hairline bg-canvas rounded-[--radius-sm] border p-3 font-mono">
            <span className="text-muted mb-1 block text-[10px]">{t("sscl")}</span>
            <span className="text-azure-text text-sm font-bold">{formatRupees(breakdown.ssclCents)}</span>
          </div>
        </div>

        {/* Formula & IRD Disclaimer Note */}
        <div className="text-muted/80 space-y-1 pt-1 font-mono text-[11px]">
          <p className="text-muted/60 text-[10px]">{t("formula")}</p>
          <p className="text-muted/70 text-[10px] italic">{t("note")}</p>
        </div>
      </div>
    </div>
  );
}
