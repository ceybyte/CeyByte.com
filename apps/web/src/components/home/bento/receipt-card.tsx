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
        "border-hairline bg-surface group relative flex flex-col justify-between overflow-hidden rounded-lg border p-6 transition-colors sm:p-8",
        className,
      )}
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="bg-azure/10 border-azure/20 text-azure flex size-10 items-center justify-center rounded-md border">
            <Languages className="size-5" />
          </div>
          <span className="text-muted font-mono text-[11px] font-semibold tracking-wider">
            TRILINGUAL 80MM RECEIPTS
          </span>
        </div>

        <h3 className="text-text mb-3 text-xl font-bold sm:text-2xl">{t("title")}</h3>

        <p className="text-muted mb-6 text-sm leading-relaxed sm:text-base">{t("body")}</p>
      </div>

      {/* Interactive Thermal Receipt Preview */}
      <div className="border-hairline bg-surface-elevated/40 -mx-6 mt-4 -mb-6 space-y-4 rounded-b-lg border-t p-6 pt-4 sm:-mx-8 sm:-mb-8 sm:p-8">
        {/* Language Tabs */}
        <div className="flex items-center justify-between">
          <span className="text-muted flex items-center gap-1.5 font-mono text-[11px]">
            <Receipt className="size-3.5" />
            <span>80MM RECEIPT LANG</span>
          </span>

          <div className="bg-canvas border-hairline inline-flex rounded-md border p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={cn(
                "cursor-pointer rounded px-2.5 py-1 transition-colors",
                lang === "en" ? "bg-azure text-inverse font-bold" : "text-muted hover:text-text",
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("si")}
              className={cn(
                "cursor-pointer rounded px-2.5 py-1 transition-colors",
                lang === "si" ? "bg-azure text-inverse font-bold" : "text-muted hover:text-text",
              )}
            >
              සිං
            </button>
            <button
              type="button"
              onClick={() => setLang("ta")}
              className={cn(
                "cursor-pointer rounded px-2.5 py-1 transition-colors",
                lang === "ta" ? "bg-azure text-inverse font-bold" : "text-muted hover:text-text",
              )}
            >
              தமி
            </button>
          </div>
        </div>

        {/* 80mm Thermal Receipt Simulation */}
        <div className="border-hairline/80 bg-canvas text-text/90 space-y-2.5 rounded border p-4 font-mono text-xs leading-snug shadow-inner">
          {/* Header */}
          <div className="border-hairline border-b border-dashed pb-2 text-center">
            <p className="text-xs font-bold text-white">{data.shop}</p>
            <p className="text-muted text-[10px]">{data.tagline}</p>
            <p className="text-muted text-[10px]">2026-10-24 14:32 · Till 01 · Bill 0142</p>
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
          <div className="border-hairline space-y-1 border-t border-dashed pt-2 text-[11px]">
            <div className="text-muted flex justify-between text-[10px]">
              <span>{data.taxLabel}</span>
              <span>Rs. 209.75</span>
            </div>
            <div className="flex justify-between pt-0.5 text-xs font-bold text-white">
              <span>{data.totalLabel}</span>
              <span className="text-azure-text">Rs. 1,375.00</span>
            </div>
            <div className="text-muted flex justify-between text-[10px]">
              <span>{data.cashLabel}</span>
              <span>Rs. 2,000.00</span>
            </div>
            <div className="text-muted flex justify-between text-[10px]">
              <span>{data.changeLabel}</span>
              <span>Rs. 625.00</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-hairline text-muted/80 border-t border-dashed pt-2 text-center text-[10px]">
            {data.footer}
          </div>
        </div>
      </div>
    </div>
  );
}
