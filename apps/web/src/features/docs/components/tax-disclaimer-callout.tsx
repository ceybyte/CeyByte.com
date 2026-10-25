"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface TaxDisclaimerCalloutProps {
  locale: string;
}

export function TaxDisclaimerCallout({ locale }: TaxDisclaimerCalloutProps) {
  const t = useTranslations("docs.tax");

  return (
    <div
      role="note"
      className="my-6 rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-4 text-xs sm:text-sm text-text-primary"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-300">Important Tax Notice</div>
          <p className="leading-relaxed text-amber-100/90">
            {t("callout")}
          </p>
          <div className="pt-1">
            <Link
              href={`/${locale}/legal/tax-disclaimer`}
              className="font-mono text-xs text-amber-300 underline underline-offset-2 hover:text-amber-200"
            >
              Read full tax disclaimer →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
