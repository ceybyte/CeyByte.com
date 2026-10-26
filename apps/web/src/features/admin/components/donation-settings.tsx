"use client";

import React, { useState } from "react";
import { Plus, Trash2, Save, UploadCloud, CheckCircle2, AlertCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateDonationPaymentSettings } from "../api";
import { presignAndUploadSlip } from "@/features/donations/api";
import type { DonationPaymentOptionItem } from "@cbpos/shared";

export interface DonationSettingsProps {
  initialSettings: DonationPaymentOptionItem[];
  onSaved?: (saved: DonationPaymentOptionItem[]) => void;
}

export function DonationSettings({
  initialSettings,
  onSaved,
}: DonationSettingsProps) {
  const [settings, setSettings] = useState<DonationPaymentOptionItem[]>(
    initialSettings || [],
  );
  const [saving, setSaving] = useState(false);
  const [uploadingQrIndex, setUploadingQrIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleAddAccount = () => {
    const newAccount: DonationPaymentOptionItem = {
      id: `bank-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      accountName: "",
      accountNumber: "",
      bankName: "",
      branchName: "",
      qrImageKey: null,
      isEnabled: true,
      notes: null,
    };
    setSettings((prev) => [...prev, newAccount]);
    setMessage(null);
  };

  const handleRemoveAccount = (index: number) => {
    setSettings((prev) => prev.filter((_, i) => i !== index));
    setMessage(null);
  };

  const handleFieldChange = (
    index: number,
    field: keyof DonationPaymentOptionItem,
    value: any,
  ) => {
    setSettings((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };
      (target as any)[field] = value;
      copy[index] = target as DonationPaymentOptionItem;
      return copy;
    });
    setMessage(null);
  };

  const handleQrUpload = async (index: number, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        text: "QR code image must be 2 MB or smaller.",
        type: "error",
      });
      return;
    }

    try {
      setUploadingQrIndex(index);
      setMessage(null);
      const { key } = await presignAndUploadSlip(file, `qr-${Date.now()}`);
      handleFieldChange(index, "qrImageKey", key);
    } catch (err: any) {
      setMessage({
        text: err.message || "Failed to upload QR code image.",
        type: "error",
      });
    } finally {
      setUploadingQrIndex(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Basic client validation
    for (const [i, opt] of settings.entries()) {
      if (!opt.accountName.trim()) {
        setMessage({ text: `Account #${i + 1}: Account Name is required.`, type: "error" });
        setSaving(false);
        return;
      }
      if (!opt.accountNumber.trim()) {
        setMessage({ text: `Account #${i + 1}: Account Number is required.`, type: "error" });
        setSaving(false);
        return;
      }
      if (!opt.bankName.trim()) {
        setMessage({ text: `Account #${i + 1}: Bank Name is required.`, type: "error" });
        setSaving(false);
        return;
      }
      if (!opt.branchName.trim()) {
        setMessage({ text: `Account #${i + 1}: Branch Name is required.`, type: "error" });
        setSaving(false);
        return;
      }
    }

    try {
      const saved = await updateDonationPaymentSettings(settings);
      setSettings(saved);
      setMessage({ text: "Settings saved successfully.", type: "success" });
      if (onSaved) onSaved(saved);
    } catch (err: any) {
      setMessage({
        text: err.message || "Failed to save payment options.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            Donation Payment Options
          </h2>
          <p className="mt-1 text-xs text-muted">
            Configure bank accounts and QR codes shown to donors on the donation page.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddAccount}
          className="gap-1.5 text-xs font-semibold"
        >
          <Plus className="size-4" />
          Add Bank Account
        </Button>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3.5 text-xs font-medium ${
            message.type === "success"
              ? "border-azure/40 bg-azure/10 text-azure-text"
              : "border-error/40 bg-error/10 text-error"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {settings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline p-12 text-center text-muted">
            <QrCode className="size-10 text-muted/40" />
            <p className="mt-2 text-sm font-medium">No bank accounts configured.</p>
            <p className="mt-1 text-xs">
              Click &ldquo;Add Bank Account&rdquo; above to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {settings.map((account, index) => (
              <div
                key={account.id}
                className="relative rounded-lg border border-hairline bg-surface p-5 shadow-xs transition-colors"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted">
                      #{index + 1}
                    </span>
                    <span className="font-semibold text-text text-sm">
                      {account.bankName || "New Account"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`enabled-${account.id}`}
                        checked={account.isEnabled}
                        onCheckedChange={(val) =>
                          handleFieldChange(index, "isEnabled", val)
                        }
                      />
                      <label
                        htmlFor={`enabled-${account.id}`}
                        className="cursor-pointer text-xs font-medium text-text select-none"
                      >
                        Active
                      </label>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAccount(index)}
                      className="size-8 text-muted hover:text-error"
                      aria-label="Delete bank account"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text">
                      Bank Name *
                    </label>
                    <Input
                      value={account.bankName}
                      onChange={(e) =>
                        handleFieldChange(index, "bankName", e.target.value)
                      }
                      placeholder="Commercial Bank of Ceylon"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text">
                      Branch Name *
                    </label>
                    <Input
                      value={account.branchName}
                      onChange={(e) =>
                        handleFieldChange(index, "branchName", e.target.value)
                      }
                      placeholder="Kollupitiya"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text">
                      Account Name *
                    </label>
                    <Input
                      value={account.accountName}
                      onChange={(e) =>
                        handleFieldChange(index, "accountName", e.target.value)
                      }
                      placeholder="CeyByte Foundation"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text">
                      Account Number *
                    </label>
                    <Input
                      value={account.accountNumber}
                      onChange={(e) =>
                        handleFieldChange(index, "accountNumber", e.target.value)
                      }
                      placeholder="100012345678"
                      className="font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-text">
                      Transfer Instructions / Notes (Optional)
                    </label>
                    <Textarea
                      value={account.notes || ""}
                      onChange={(e) =>
                        handleFieldChange(index, "notes", e.target.value || null)
                      }
                      placeholder="Please include your reference code in transfer remarks."
                      rows={2}
                    />
                  </div>

                  {/* QR Upload / Key */}
                  <div className="sm:col-span-2 rounded border border-hairline/60 bg-surface-elevated/40 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                        <QrCode className="size-3.5 text-muted" />
                        QR Code Image (Optional)
                      </label>
                      {account.qrImageKey && (
                        <span className="font-mono text-[10px] text-azure">
                          {account.qrImageKey}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleQrUpload(index, e.target.files[0]);
                          }
                        }}
                        disabled={uploadingQrIndex === index}
                        className="text-xs file:mr-2 file:cursor-pointer"
                      />
                      {account.qrImageKey && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleFieldChange(index, "qrImageKey", null)
                          }
                          className="text-xs text-muted hover:text-error"
                        >
                          Remove QR
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="secondary"
            loading={saving}
            disabled={settings.length === 0}
            className="gap-2 font-bold px-6"
          >
            <Save className="size-4" />
            Save Payment Options
          </Button>
        </div>
      </form>
    </div>
  );
}
