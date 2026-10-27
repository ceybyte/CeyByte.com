import React from "react";
import { Globe } from "lucide-react";

export interface AlsoInEnglishBannerProps {
  title: string;
  lead: string;
  className?: string;
}

export function AlsoInEnglishBanner({ title, lead, className = "" }: AlsoInEnglishBannerProps) {
  return (
    <aside
      role="note"
      aria-label={title}
      className={`border-hairline border-l-azure bg-surface/70 my-6 rounded-xl border border-l-4 p-4.5 shadow-xs backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <Globe className="text-azure-text mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-text text-sm font-bold">{title}</h4>
          <p className="text-muted text-xs leading-relaxed">{lead}</p>
        </div>
      </div>
    </aside>
  );
}
