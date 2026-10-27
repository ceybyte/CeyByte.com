"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Download, Copy, Check, ShieldCheck, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGate } from "@/components/gate/gate-context";

export interface ReleaseCardData {
  version: string;
  release_date: string;
  download_url: string;
  sha256: string;
  min_version?: string;
  exe_size?: number;
}

export function LatestReleaseCard({ release, locale }: { release: ReleaseCardData; locale: string }) {
  const t = useTranslations("releases");
  const { openGate } = useGate();
  const [copied, setCopied] = useState(false);

  const fileName = `CBPOSSetup-${release.version}.exe`;
  const sizeMb = release.exe_size ? Math.round(release.exe_size / (1024 * 1024)) : 50;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(release.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  }, [release.sha256]);

  return (
    <div className="border-hairline bg-surface relative overflow-hidden rounded-lg border p-6 shadow-2xl sm:p-8">
      {/* Glow border highlight */}
      <div className="via-azure/50 pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />

      <div className="flex flex-col gap-6">
        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary/10 text-primary border-primary/30 rounded border px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider uppercase">
              {t("latest")}
            </span>
            <span className="text-text font-mono text-xl font-bold tracking-tight sm:text-2xl">
              v{release.version}
            </span>
            <span className="text-text-muted hidden font-mono text-xs sm:inline">({fileName})</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-text-muted">{t("published", { date: release.release_date })}</span>
            <span className="text-hairline">·</span>
            <span className="border-hairline bg-surface-elevated text-text-muted flex items-center gap-1.5 rounded border px-2 py-0.5">
              <Monitor className="text-azure-text size-3" />
              {t("windowsReq")}
            </span>
          </div>
        </div>

        {/* Primary Download Button (The ONE loud neon green button per viewport) */}
        <div>
          <Button
            asChild
            variant="primary"
            size="xl"
            className="min-h-14 w-full px-4 py-3 text-center text-sm font-bold whitespace-normal shadow-lg transition-all duration-300 hover:brightness-105 sm:w-auto sm:px-8 sm:text-base"
          >
            <a
              href={`/${locale}/download`}
              onClick={(e) => {
                e.preventDefault();
                openGate();
              }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <Download className="size-5 shrink-0" />
              <span className="text-center">
                {t("download.exe")} — {sizeMb} MB
              </span>
            </a>
          </Button>
        </div>

        {/* SHA-256 Hash Box */}
        <div className="border-hairline bg-surface-elevated rounded-md border p-3.5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-text-muted flex items-center gap-1.5 font-medium">
              <ShieldCheck className="text-azure-text size-4" />
              SHA-256 Checksum
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-azure-text hover:text-text flex cursor-pointer items-center gap-1 text-xs transition-colors"
              aria-label="Copy SHA-256 hash"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-text font-mono text-xs leading-relaxed break-all select-all">{release.sha256}</p>
        </div>
      </div>
    </div>
  );
}
