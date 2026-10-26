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
            className={`rounded-full px-4 py-2 font-mono text-xs whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isActive
                ? "border border-cyan-400 bg-cyan-400/10 font-semibold text-cyan-300 shadow-sm shadow-cyan-950/50"
                : "border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
