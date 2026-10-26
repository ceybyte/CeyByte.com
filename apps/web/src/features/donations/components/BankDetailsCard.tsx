"use client";

import React, { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-xs transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline/60 pb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {copy.bank}
          </span>
          <h3 className="text-lg font-bold text-text">{option.bankName}</h3>
          <p className="text-xs text-muted">
            {copy.branch}: <span className="text-text">{option.branchName}</span>
          </p>
        </div>

        {option.qrImageKey && (
          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs font-medium"
              >
                <QrCode className="size-4" />
                {copy.scanQr}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs text-center sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-center font-bold text-text">
                  {copy.scanQr}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-2 flex flex-col items-center justify-center gap-3">
                {qrSrc && (
                  <img
                    src={qrSrc}
                    alt={`${option.bankName} QR`}
                    className="size-52 rounded border border-hairline bg-white p-2 object-contain shadow-xs"
                  />
                )}
                <p className="text-xs leading-relaxed text-muted">{copy.scanQrHelp}</p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-hairline/60 bg-surface-elevated/40 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            {copy.accountName}
          </span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-text select-all">{option.accountName}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => handleCopy(option.accountName, "name")}
              aria-label={copy.copy}
            >
              {copiedField === "name" ? (
                <Check className="size-3.5 text-azure" />
              ) : (
                <Copy className="size-3.5 text-muted hover:text-text" />
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-hairline/60 bg-surface-elevated/40 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            {copy.accountNumber}
          </span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-mono font-bold tracking-wider text-text select-all">
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
                <Check className="size-3.5 text-azure" />
              ) : (
                <Copy className="size-3.5 text-muted hover:text-text" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {option.notes && (
        <div className="mt-3 rounded border border-hairline/40 bg-surface/50 p-2.5 text-xs text-muted">
          {copy.notes && <strong className="mr-1 text-text">{copy.notes}:</strong>}
          <span>{option.notes}</span>
        </div>
      )}
    </div>
  );
}
