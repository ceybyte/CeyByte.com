"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

export function VerifyExpander({ version }: { version: string }) {
  const t = useTranslations("releases");
  const [open, setOpen] = useState(false);
  const [copiedPs, setCopiedPs] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const fileName = `CBPOSSetup-${version}.exe`;
  const psCmd = `Get-FileHash .\\${fileName} -Algorithm SHA256`;
  const cmdCmd = `certutil -hashfile ${fileName} SHA256`;

  const copyToClipboard = useCallback(async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  }, []);

  return (
    <div className="border-hairline bg-surface rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="hover:bg-surface-elevated/50 flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors sm:p-5"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="bg-azure/10 border-azure/20 flex size-8 shrink-0 items-center justify-center rounded border">
            <Terminal className="text-azure-text size-4" />
          </div>
          <div>
            <h3 className="text-text text-sm font-semibold sm:text-base">{t("verify.title")}</h3>
            <p className="text-text-muted mt-0.5 text-xs">{t("verify.file", { version })}</p>
          </div>
        </div>
        <div className="text-text-muted">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {open && (
        <div className="border-hairline-grid space-y-4 border-t p-4 sm:p-5">
          <p className="text-text-muted text-xs leading-relaxed sm:text-sm">{t("verify.body")}</p>

          {/* PowerShell Command */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted font-mono font-medium">PowerShell</span>
              <button
                type="button"
                onClick={() => copyToClipboard(psCmd, setCopiedPs)}
                className="text-azure-text hover:text-text flex items-center gap-1 text-xs"
              >
                {copiedPs ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedPs ? "Copied" : "Copy command"}</span>
              </button>
            </div>
            <pre className="border-hairline bg-canvas text-text overflow-x-auto rounded-md border p-3 font-mono text-xs select-all">
              {psCmd}
            </pre>
          </div>

          {/* Command Prompt (CMD) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted font-mono font-medium">Command Prompt (cmd.exe)</span>
              <button
                type="button"
                onClick={() => copyToClipboard(cmdCmd, setCopiedCmd)}
                className="text-azure-text hover:text-text flex items-center gap-1 text-xs"
              >
                {copiedCmd ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedCmd ? "Copied" : "Copy command"}</span>
              </button>
            </div>
            <pre className="border-hairline bg-canvas text-text overflow-x-auto rounded-md border p-3 font-mono text-xs select-all">
              {cmdCmd}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
