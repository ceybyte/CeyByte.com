"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MessageCircle,
  Share2,
  Download,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GateDownloadResult } from "./gate-context";

const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/BS73D23VD74BbseKuoC1BM";

interface WhatNextViewProps {
  data: GateDownloadResult | null;
  onClose?: () => void;
}

export function WhatNextView({ data }: WhatNextViewProps) {
  const t = useTranslations("gate");
  const [copiedHash, setCopiedHash] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [shared, setShared] = useState(false);

  const release = data?.release;
  const fileName = release?.exe_name ?? "CBPOSSetup-latest.exe";
  const sizeMb = release?.exe_size ? Math.round(release.exe_size / (1024 * 1024)) : 50;
  const sha256 =
    release?.exe_sha256 ?? "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const downloadUrl = data?.downloadUrl ?? "/api/download/latest";

  const handleCopyHash = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // ignore clipboard error
    }
  }, [sha256]);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "CB POS Download",
          text: "Free point-of-sale software for Sri Lankan shops",
          url: window.location.origin + downloadUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // ignore share abort
      }
    } else if (typeof navigator !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.origin + downloadUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // ignore clipboard error
      }
    }
  }, [downloadUrl]);

  return (
    <div className="flex flex-col gap-5 py-1">
      {/* Header with Azure Check and Filename */}
      <div className="flex items-start gap-3">
        <div className="bg-azure/10 border-azure/30 flex size-10 shrink-0 items-center justify-center rounded-full border">
          <Check className="text-azure-text size-5 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-text text-lg font-bold sm:text-xl">{t("done.title")}</h3>
          <p className="text-text-muted font-mono text-xs">
            {t("done.file", { fileName, sizeMb })}
          </p>
        </div>
      </div>

      {/* SHA-256 Hash Box with Copy Icon */}
      <div className="border-hairline bg-surface-elevated rounded-md border p-3">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-text-muted flex items-center gap-1.5 font-medium">
            <ShieldCheck className="size-3.5 text-azure-text" />
            {t("done.hashLabel")}
          </span>
          <button
            type="button"
            onClick={handleCopyHash}
            className="text-azure-text hover:text-text inline-flex cursor-pointer items-center gap-1 text-xs transition-colors"
            aria-label={t("done.copyHash")}
          >
            {copiedHash ? (
              <>
                <Check className="size-3.5" />
                <span>{t("done.copied")}</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>{t("done.copyHash")}</span>
              </>
            )}
          </button>
        </div>
        <p className="text-text select-all font-mono text-xs break-all leading-relaxed">
          {sha256}
        </p>

        {/* Collapsible File Verification Commands */}
        <div className="border-hairline-grid mt-2 border-t pt-2">
          <button
            type="button"
            onClick={() => setShowVerify((prev) => !prev)}
            className="text-text-muted hover:text-text flex w-full items-center justify-between text-xs transition-colors"
          >
            <span className="flex items-center gap-1">
              <Terminal className="size-3.5" />
              {t("done.verify")}
            </span>
            {showVerify ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>

          {showVerify && (
            <div className="mt-2 space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-text-muted text-[10px]">PowerShell:</span>
                <pre className="border-hairline bg-canvas text-text mt-0.5 overflow-x-auto rounded p-2">
                  Get-FileHash .\{fileName} -Algorithm SHA256
                </pre>
              </div>
              <div>
                <span className="text-text-muted text-[10px]">Command Prompt (CMD):</span>
                <pre className="border-hairline bg-canvas text-text mt-0.5 overflow-x-auto rounded p-2">
                  certutil -hashfile {fileName} SHA256
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Windows SmartScreen Warning Card [A5] */}
      <div className="border-warning/40 bg-surface-elevated rounded-md border p-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="text-warning size-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="text-text font-semibold">{t("done.smartscreen.title")}</h4>
            <p className="text-text-muted mt-1 leading-relaxed">
              {t("done.smartscreen.body")}
            </p>
          </div>
        </div>
      </div>

      {/* Numbered Next Steps [A4], [I1], [B1] */}
      <div className="space-y-2">
        <h4 className="text-text text-xs font-semibold uppercase tracking-wider">
          {t("done.steps.title")}
        </h4>
        <div className="space-y-2">
          <div className="border-hairline bg-surface-elevated flex items-start gap-3 rounded-md border p-2.5 text-xs">
            <span className="bg-surface text-azure-text border-hairline flex size-5 shrink-0 items-center justify-center rounded-full border font-mono font-bold text-[10px]">
              1
            </span>
            <span className="text-text-muted leading-relaxed">{t("done.steps.1")}</span>
          </div>
          <div className="border-hairline bg-surface-elevated flex items-start gap-3 rounded-md border p-2.5 text-xs">
            <span className="bg-surface text-azure-text border-hairline flex size-5 shrink-0 items-center justify-center rounded-full border font-mono font-bold text-[10px]">
              2
            </span>
            <span className="text-text-muted leading-relaxed">{t("done.steps.2")}</span>
          </div>
          <div className="border-hairline bg-surface-elevated flex items-start gap-3 rounded-md border p-2.5 text-xs">
            <span className="bg-surface text-azure-text border-hairline flex size-5 shrink-0 items-center justify-center rounded-full border font-mono font-bold text-[10px]">
              3
            </span>
            <span className="text-text-muted leading-relaxed">{t("done.steps.3")}</span>
          </div>
        </div>
      </div>

      {/* WhatsApp Community Link */}
      <a
        href={WHATSAPP_COMMUNITY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="border-hairline bg-surface-elevated hover:border-azure/40 flex items-center justify-between rounded-md border p-3 text-xs transition-colors"
      >
        <span className="text-text flex items-center gap-2 font-medium">
          <MessageCircle className="text-azure-text size-4" />
          {t("done.whatsapp")}
        </span>
        <span className="text-azure-text font-mono text-[11px]">→</span>
      </a>

      {/* Save Listing / Claim Account Secondary Card */}
      {data?.claimToken && (
        <div className="border-hairline bg-surface-elevated flex flex-col items-start justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
          <div className="text-xs">
            <h5 className="text-text font-semibold">{t("done.claim.title")}</h5>
            <p className="text-text-muted mt-0.5">{t("done.claim.body")}</p>
          </div>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
          >
            <a href={`/auth/claim?token=${encodeURIComponent(data.claimToken)}`}>
              {t("done.claim.cta")}
            </a>
          </Button>
        </div>
      )}

      {/* Bottom Footer Actions: Retry & Mobile Share */}
      <div className="border-hairline-grid flex flex-col items-center justify-between gap-3 border-t pt-3 sm:flex-row">
        <a
          href={downloadUrl}
          className="text-text-muted hover:text-text flex items-center gap-1.5 text-xs transition-colors"
        >
          <Download className="size-3.5" />
          <span>{t("done.retry")}</span>
        </a>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="text-text-muted hover:text-text text-xs"
        >
          <Share2 className="size-3.5" />
          <span>{shared ? t("done.copied") : t("done.mobileShare")}</span>
        </Button>
      </div>
    </div>
  );
}
