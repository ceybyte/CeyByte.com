"use client";

import React, { useEffect } from "react";
import { Download, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SlipPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slipUrl: string | null;
  contentType?: string | null;
  referenceCode: string;
}

export function SlipPreviewModal({
  isOpen,
  onClose,
  slipUrl,
  contentType,
  referenceCode,
}: SlipPreviewModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPdf =
    contentType === "application/pdf" ||
    (slipUrl ? slipUrl.toLowerCase().includes(".pdf") : false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Slip preview for ${referenceCode}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex flex-row items-center justify-between border-b border-hairline px-6 py-4">
          <div className="flex items-center gap-2.5">
            {isPdf ? (
              <FileText className="size-5 text-azure" />
            ) : (
              <ImageIcon className="size-5 text-azure" />
            )}
            <div>
              <h3 className="font-mono text-base font-bold text-text">
                {referenceCode}
              </h3>
              <p className="text-[11px] text-muted">
                {isPdf ? "PDF Document" : "Deposit Slip Image"} · 120s secure preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {slipUrl && (
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="gap-1.5 text-xs"
              >
                <a href={slipUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="size-3.5" />
                  Download
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 text-muted hover:text-text"
              aria-label="Close preview"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Sandboxed Body */}
        <div className="relative flex min-h-[350px] max-h-[70vh] flex-1 items-center justify-center overflow-auto bg-canvas/80 p-4">
          {slipUrl ? (
            isPdf ? (
              <iframe
                src={slipUrl}
                title={`Slip preview for ${referenceCode}`}
                className="h-[600px] w-full rounded border border-hairline bg-white shadow-xs"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <img
                src={slipUrl}
                alt={`Slip for ${referenceCode}`}
                className="max-h-[65vh] max-w-full rounded border border-hairline object-contain shadow-xs"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted">
              <p className="text-sm">No preview available or URL expired.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
