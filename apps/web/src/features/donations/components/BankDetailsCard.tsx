"use client";

import React, { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { DonationPaymentOption } from "../types";

export interface BankDetailsCardProps {
  option: DonationPaymentOption;
  copy: {
    accountName: string;
    accountNumber: string;
    bank: string;
    branch: string;
    notes?: string;
    copy: string;
    copied: string;
    scanQr: string;
    scanQrHelp: string;
  };
}

export function BankDetailsCard({ option, copy }: BankDetailsCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const handleCopy = async (val: string, fieldId: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(val);
      }
      setCopiedField(fieldId);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch {
      // ignore
    }
  };

  const qrSrc = option.qrImageKey
    ? option.qrImageKey.startsWith("http") || option.qrImageKey.startsWith("data:")
      ? option.qrImageKey
      : `/api/uploads/${option.qrImageKey}`
    : null;

  return (
    <div className="border-hairline bg-surface rounded-lg border p-5 shadow-xs transition-colors">
      <div className="border-hairline/60 flex flex-wrap items-start justify-between gap-3 border-b pb-3">
        <div>
          <span className="text-muted text-xs font-semibold tracking-wider uppercase">{copy.bank}</span>
          <h3 className="text-text text-lg font-bold">{option.bankName}</h3>
          <p className="text-muted text-xs">
            {copy.branch}: <span className="text-text">{option.branchName}</span>
          </p>
        </div>

        {option.qrImageKey && (
          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="gap-1.5 text-xs font-medium">
                <QrCode className="size-4" />
                {copy.scanQr}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs text-center sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-text text-center font-bold">{copy.scanQr}</DialogTitle>
              </DialogHeader>
              <div className="mt-2 flex flex-col items-center justify-center gap-3">
                {qrSrc && (
                  <img
                    src={qrSrc}
                    alt={`${option.bankName} QR`}
                    className="border-hairline size-52 rounded border bg-white object-contain p-2 shadow-xs"
                  />
                )}
                <p className="text-muted text-xs leading-relaxed">{copy.scanQrHelp}</p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="border-hairline/60 bg-surface-elevated/40 rounded-md border p-3">
          <span className="text-muted text-[11px] font-medium tracking-wider uppercase">
            {copy.accountName}
          </span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-text font-semibold select-all">{option.accountName}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => handleCopy(option.accountName, "name")}
              aria-label={copy.copy}
            >
              {copiedField === "name" ? (
                <Check className="text-azure size-3.5" />
              ) : (
                <Copy className="text-muted hover:text-text size-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div className="border-hairline/60 bg-surface-elevated/40 rounded-md border p-3">
          <span className="text-muted text-[11px] font-medium tracking-wider uppercase">
            {copy.accountNumber}
          </span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-text font-mono font-bold tracking-wider select-all">
              {option.accountNumber}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => handleCopy(option.accountNumber, "number")}
              aria-label={copy.copy}
            >
              {copiedField === "number" ? (
                <Check className="text-azure size-3.5" />
              ) : (
                <Copy className="text-muted hover:text-text size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {option.notes && (
        <div className="border-hairline/40 bg-surface/50 text-muted mt-3 rounded border p-2.5 text-xs">
          {copy.notes && <strong className="text-text mr-1">{copy.notes}:</strong>}
          <span>{option.notes}</span>
        </div>
      )}
    </div>
  );
}
