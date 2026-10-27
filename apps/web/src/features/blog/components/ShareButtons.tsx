"use client";

import React, { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export interface ShareButtonsProps {
  title: string;
  url: string;
  copyLabel?: string;
  copiedLabel?: string;
  shareLabel?: string;
}

export function ShareButtons({
  title,
  url,
  copyLabel = "Copy link",
  copiedLabel = "Link copied",
  shareLabel = "Share",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  return (
    <div className="border-hairline flex flex-wrap items-center gap-3 border-t pt-6 font-mono text-xs">
      <span className="text-muted inline-flex items-center gap-1.5 tracking-wider uppercase">
        <Share2 className="h-3.5 w-3.5" />
        {shareLabel}:
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="border-hairline bg-surface/80 text-text hover:bg-surface-elevated hover:text-azure-text hover:border-azure/30 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-all"
      >
        {copied ? (
          <Check className="text-azure-text h-3.5 w-3.5" />
        ) : (
          <Copy className="text-muted h-3.5 w-3.5" />
        )}
        <span>{copied ? copiedLabel : copyLabel}</span>
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-hairline bg-surface/80 text-text hover:bg-surface-elevated hover:text-azure-text hover:border-azure/30 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-all"
      >
        WhatsApp
      </a>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-hairline bg-surface/80 text-text hover:bg-surface-elevated hover:text-azure-text hover:border-azure/30 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-all"
      >
        X (Twitter)
      </a>
    </div>
  );
}
