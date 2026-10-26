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
    <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-6 font-mono text-xs">
      <span className="inline-flex items-center gap-1.5 tracking-wider text-zinc-500 uppercase">
        <Share2 className="h-3.5 w-3.5" />
        {shareLabel}:
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-zinc-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-cyan-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-zinc-400" />
        )}
        <span>{copied ? copiedLabel : copyLabel}</span>
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-zinc-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
      >
        WhatsApp
      </a>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-zinc-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
      >
        X (Twitter)
      </a>
    </div>
  );
}
