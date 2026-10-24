"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Languages, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

type LocaleTab = "en" | "si" | "ta";

const RECEIPT_DATA = {
  en: {
    shop: "CEYLON GROCERS (PVT) LTD",
    tagline: "Retail & Wholesale · Colombo 03",
    taxLabel: "VAT (18% Included)",
    totalLabel: "TOTAL LKR",
    cashLabel: "CASH TENDERED",
    changeLabel: "CHANGE",
    footer: "Thank you! Please come again.",
  },
  si: {
    shop: "සෙලෝන් ග්‍රොසර්ස් (පුද්) සමාගම",
    tagline: "සිල්ලර සහ තොග වෙළෙඳාම · කොළඹ 03",
    taxLabel: "වැට් (18% ඇතුළත්ව)",
    totalLabel: "මුළු එකතුව (රු.)",
    cashLabel: "ලැබුණු මුදල්",
    changeLabel: "ඉතිරි මුදල",
    footer: "ස්තූතියි! නැවත එන්න.",
  },
  ta: {
    shop: "சிலோன் குரோசர்ஸ் (பிரைவேட்) லிமிடெட்",
    tagline: "சில்லறை மற்றும் மொத்த விற்பனை · கொழும்பு 03",
    taxLabel: "VAT (18% உள்ளடங்கியது)",
    totalLabel: "மொத்தத் தொகை (ரூ.)",
    cashLabel: "செலுத்தப்பட்ட ரொக்கம்",
    changeLabel: "மீதித் தொகை",
    footer: "நன்றி! மீண்டும் வருக.",
  },
};

export function ReceiptCard({ className }: { className?: string }) {
  const t = useTranslations("home.bento.receipts");
  const [lang, setLang] = useState<LocaleTab>("en");
  const data = RECEIPT_DATA[lang];

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
            <Languages className="size-5" />
          </div>
          <span className="font-mono text-[11px] text-muted">TRILINGUAL ESC/POS [E2] [F2]</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
          {t("title")}
        </h3>

        <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
          {t("body")}
        </p>
      </div>

      {/* Interactive Thermal Receipt Preview */}
      <div className="mt-4 pt-4 border-t border-hairline bg-surface-elevated/40 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-lg space-y-4">
        {/* Language Tabs */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted flex items-center gap-1.5">
            <Receipt className="size-3.5" />
            <span>80MM RECEIPT LANG</span>
          </span>

          <div className="inline-flex rounded-md p-0.5 bg-[#090a0f] border border-hairline text-xs font-mono">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors cursor-pointer",
                lang === "en" ? "bg-azure text-inverse font-bold" : "text-muted hover:text-text"
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("si")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors cursor-pointer",
                lang === "si" ? "bg-azure text-inverse font-bold" : "text-muted hover:text-text"
              )}
            >
              සිං
            </button>
            <button
              type="button"
              onClick={() => setLang("ta")}
              className={cn(
                "px-2.5 py-1 rounded transition-colors cursor-pointer",
                lang === "ta" ? "bg-azure text-inverse font-bold" : "text-muted hover:text-text"
              )}
            >
              தமி
            </button>
          </div>
        </div>

        {/* 80mm Thermal Receipt Simulation */}
        <div className="rounded border border-hairline/80 bg-[#12161f] p-4 font-mono text-xs text-text/90 shadow-inner space-y-2.5 leading-snug">
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-hairline">
            <p className="font-bold text-white text-xs">{data.shop}</p>
            <p className="text-[10px] text-muted">{data.tagline}</p>
            <p className="text-[10px] text-muted">2026-10-24 14:32 · Till #01 · Bill #0142</p>
          </div>

          {/* Item lines (English per [F2] spec) */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>KEERI SAMBA 1.250kg</span>
              <span>325.00</span>
            </div>
            <div className="flex justify-between">
              <span>ANCHOR 400G 1pcs</span>
              <span>1,050.00</span>
            </div>
          </div>

          {/* Totals in selected language */}
          <div className="pt-2 border-t border-dashed border-hairline space-y-1 text-[11px]">
            <div className="flex justify-between text-muted text-[10px]">
              <span>{data.taxLabel}</span>
              <span>Rs. 209.75</span>
            </div>
            <div className="flex justify-between font-bold text-white text-xs pt-0.5">
              <span>{data.totalLabel}</span>
              <span className="text-azure-text">Rs. 1,375.00</span>
            </div>
            <div className="flex justify-between text-muted text-[10px]">
              <span>{data.cashLabel}</span>
              <span>Rs. 2,000.00</span>
            </div>
            <div className="flex justify-between text-muted text-[10px]">
              <span>{data.changeLabel}</span>
              <span>Rs. 625.00</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-2 border-t border-dashed border-hairline text-[10px] text-muted/80">
            {data.footer}
          </div>
        </div>
      </div>
    </div>
  );
}
