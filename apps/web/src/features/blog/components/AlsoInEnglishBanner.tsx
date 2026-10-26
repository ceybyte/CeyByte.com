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
      className={`my-6 rounded-lg border border-l-4 border-cyan-400 border-zinc-800/80 bg-cyan-950/20 p-4.5 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <Globe className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-cyan-300">{title}</h4>
          <p className="text-xs leading-relaxed text-zinc-300">{lead}</p>
        </div>
      </div>
    </aside>
  );
}
