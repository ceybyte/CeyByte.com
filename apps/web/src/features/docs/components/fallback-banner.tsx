"use client";

import React from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface FallbackBannerProps {
  locale: string;
}

export function FallbackBanner({ locale }: FallbackBannerProps) {
  const t = useTranslations("docs.fallback.banner");

  let message = "";
  try {
    message = t(locale as any);
  } catch {
    message =
      locale === "si"
        ? "මෙම පිටුව තවමත් සිංහල භාෂාවෙන් නොමැත, එබැවින් ඔබ ඉංග්‍රීසි පිටපත කියවමින් සිටී."
        : "இந்தப் பக்கம் இன்னும் தமிழில் கிடைக்கவில்லை, எனவே நீங்கள் ஆங்கில பதிப்பைப் படிக்கிறீர்கள்.";
  }

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-lg border border-azure/40 bg-azure/10 p-4 text-xs sm:text-sm text-text-primary"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-azure" />
      <div className="leading-relaxed">
        <span className="font-medium text-azure">English Fallback: </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
