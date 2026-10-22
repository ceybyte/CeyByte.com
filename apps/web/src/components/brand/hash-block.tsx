"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type HashBlockProps = {
  label: string; // e.g. "SHA-256"
  fileName: string; // e.g. "CBPOSSetup-1.3.0.exe"
  hash: string;
  copyLabel: string;
  copiedLabel: string;
  className?: string;
};

// 03-DESIGN §7.3. The hash and file name are data, so they're mono; the label is prose.
export function HashBlock({ label, fileName, hash, copyLabel, copiedLabel, className }: HashBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("border-hairline bg-surface rounded-sm border p-3", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-muted min-w-0 truncate text-sm">
          {label} · <span className="text-text font-mono">{fileName}</span>
        </p>
        <button
          type="button"
          onClick={copy}
          className="text-muted hover:bg-surface-elevated hover:text-text inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-colors"
          aria-label={copyLabel}
        >
          {copied ? (
            <Check aria-hidden className="text-success size-4" />
          ) : (
            <Copy aria-hidden className="size-4" />
          )}
        </button>
      </div>
      <code className="text-hash text-text block">{hash}</code>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </div>
  );
}
