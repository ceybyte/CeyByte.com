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
        className="w-full max-w-md rounded-lg border border-hairline bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <Command className="h-4 w-4 text-azure" />
            <h2 className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-hairline">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2 text-xs">
              <span className="text-text-muted">{s.desc}</span>
              <kbd className="rounded border border-hairline bg-canvas px-2 py-0.5 font-mono text-[11px] text-text-primary shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-hairline pt-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
