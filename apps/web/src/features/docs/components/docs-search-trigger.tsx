"use client";

import React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface DocsSearchTriggerProps {
  onClick?: () => void;
}

export function DocsSearchTrigger({ onClick }: DocsSearchTriggerProps) {
  const t = useTranslations("docs.search");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full max-w-2xl items-center justify-between rounded-lg border border-hairline bg-surface px-4 py-3 text-left shadow-sm transition-all hover:border-azure/50 hover:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-azure"
      aria-label={t("trigger")}
    >
      <div className="flex items-center gap-3 text-text-muted transition-colors group-hover:text-text-primary">
        <Search className="h-4 w-4 text-text-muted group-hover:text-azure" />
        <span className="text-sm">{t("trigger")}</span>
      </div>
      <kbd className="inline-flex h-5 items-center gap-1 rounded border border-hairline bg-surface-elevated px-1.5 font-mono text-[11px] font-medium text-text-muted group-hover:text-text-primary">
        {t("hint")}
      </kbd>
    </button>
  );
}
