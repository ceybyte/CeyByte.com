"use client";

import React from "react";
import type { TagItem } from "../types";

export interface TagFilterBarProps {
  activeTag: string;
  onSelectTag: (tag: string) => void;
  tags: TagItem[];
  className?: string;
}

export function TagFilterBar({ activeTag, onSelectTag, tags, className = "" }: TagFilterBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter blog posts by category"
      className={`flex scrollbar-none items-center gap-2 overflow-x-auto pb-2 ${className}`}
    >
      {tags.map((tag) => {
        const isActive = activeTag.toLowerCase() === tag.key.toLowerCase();
        return (
          <button
            key={tag.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectTag(tag.key)}
            className={`focus-visible:ring-azure rounded-full px-4 py-2 font-mono text-xs whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 ${
              isActive
                ? "border-azure/40 bg-azure/10 text-azure-text border font-semibold shadow-xs"
                : "border-hairline bg-surface/80 text-muted hover:border-hairline hover:text-text hover:bg-surface-elevated border"
            }`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
