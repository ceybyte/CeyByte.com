"use client";

import React from "react";
import { Plus, Minus, Maximize2 } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetBounds: () => void;
}

export function MapControls({ onZoomIn, onZoomOut, onResetBounds }: MapControlsProps) {
  return (
    <div className="absolute right-4 bottom-6 z-10 flex flex-col gap-1.5 shadow-md">
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom in"
        className="border-hairline bg-surface text-text hover:bg-surface-elevated focus-visible:ring-azure flex h-8 w-8 items-center justify-center rounded-sm border transition-colors hover:text-white focus-visible:ring-2 focus-visible:outline-none"
      >
        <Plus className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom out"
        className="border-hairline bg-surface text-text hover:bg-surface-elevated focus-visible:ring-azure flex h-8 w-8 items-center justify-center rounded-sm border transition-colors hover:text-white focus-visible:ring-2 focus-visible:outline-none"
      >
        <Minus className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onResetBounds}
        aria-label="Reset view to Sri Lanka"
        title="Reset view to Sri Lanka"
        className="border-hairline bg-surface text-text hover:bg-surface-elevated focus-visible:ring-azure flex h-8 w-8 items-center justify-center rounded-sm border transition-colors hover:text-white focus-visible:ring-2 focus-visible:outline-none"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
