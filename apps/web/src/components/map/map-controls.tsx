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
    <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-1.5 shadow-md">
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom in"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-hairline bg-surface text-text hover:bg-surface-elevated hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure"
      >
        <Plus className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom out"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-hairline bg-surface text-text hover:bg-surface-elevated hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure"
      >
        <Minus className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onResetBounds}
        aria-label="Reset view to Sri Lanka"
        title="Reset view to Sri Lanka"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-hairline bg-surface text-text hover:bg-surface-elevated hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
