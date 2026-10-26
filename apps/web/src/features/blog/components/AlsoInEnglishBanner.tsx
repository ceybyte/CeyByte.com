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
      className={`rounded-lg border-l-4 border-cyan-400 bg-cyan-950/20 border border-zinc-800/80 p-4.5 my-6 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <Globe className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-cyan-300">{title}</h4>
          <p className="text-xs text-zinc-300 leading-relaxed">{lead}</p>
        </div>
      </div>
    </aside>
  );
}
