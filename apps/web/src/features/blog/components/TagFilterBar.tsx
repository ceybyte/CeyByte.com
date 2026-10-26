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
      className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none ${className}`}
    >
      {tags.map((tag) => {
        const isActive = activeTag.toLowerCase() === tag.key.toLowerCase();
        return (
          <button
            key={tag.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectTag(tag.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-mono transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              isActive
                ? "border border-cyan-400 bg-cyan-400/10 text-cyan-300 font-semibold shadow-sm shadow-cyan-950/50"
                : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
