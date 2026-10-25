"use client";

import React from "react";
import { X, Command } from "lucide-react";

interface AdminShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "/", desc: "Focus search" },
  { key: "?", desc: "Toggle shortcuts help" },
  { key: "g then o", desc: "Go to Overview" },
  { key: "g then m", desc: "Go to Merchants" },
  { key: "g then d", desc: "Go to Docs" },
  { key: "g then r", desc: "Go to Releases" },
  { key: "g then a", desc: "Go to Audit log" },
  { key: "Esc", desc: "Close drawer or dialog" },
];

export function AdminShortcutsModal({ open, onClose }: AdminShortcutsModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="border-hairline bg-surface w-full max-w-md rounded-lg border p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-hairline flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Command className="text-azure h-4 w-4" />
            <h2 className="text-text-primary text-sm font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary rounded p-1 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-hairline mt-4 divide-y">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2 text-xs">
              <span className="text-text-muted">{s.desc}</span>
              <kbd className="border-hairline bg-canvas text-text-primary rounded border px-2 py-0.5 font-mono text-[11px] shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="border-hairline mt-4 border-t pt-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="border-hairline bg-surface-elevated text-text-primary hover:bg-surface rounded border px-3 py-1.5 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
