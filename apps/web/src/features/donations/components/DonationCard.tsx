"use client";

import React, { useState } from "react";
import { Copy, Check, ArrowRight, ShieldAlert, Sparkles, Building2, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TurnstileWidget } from "@/components/gate/turnstile-widget";
import { BankDetailsCard } from "./BankDetailsCard";
import { SlipDropzone } from "./SlipDropzone";
import {
  createDonation,
  fetchDonationStatus,
  presignAndUploadSlip,
  submitDonationSlip,
} from "../api";
import type { DonationPaymentOption } from "../types";

export interface DonationCardProps {
  initialPaymentOptions: DonationPaymentOption[];
  copy: {
    amount: {
      label: string;
      custom: string;
      customPlaceholder: string;
      min: string;
    };
    name: {
      label: string;
      placeholder: string;
    };
    anonymous: string;
    message: {
      label: string;
      placeholder: string;
    };
    showAmount: string;
    link: {
      label: string;
      phone: string;
      phonePlaceholder: string;
    };
    contact: {
      label: string;
      placeholder: string;
      help: string;
    };
    create: string;
    creating: string;
    ref: {
      title: string;
      help: string;
    };
    bank: {
      accountName: string;
      accountNumber: string;
      bank: string;
      branch: string;
      notes: string;
      copy: string;
      copied: string;
      scanQr: string;
      scanQrHelp: string;
    };
    slip: {
      label: string;
      help: string;
      drag: string;
      uploaded: string;
      uploading: string;
    };
    txnRef: {
      label: string;
      placeholder: string;
      help: string;
    };
    submit: string;
    submitting: string;
    pending: {
      title: string;
      body: string;
    };
    approved: {
      title: string;
    };
    resume: {
      button: string;
      title: string;
      prompt: string;
      placeholder: string;
      submit: string;
    };
  };
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

export function DonationCard({ initialPaymentOptions, copy }: DonationCardProps) {
  // Step: 1 (details), 2 (bank transfer & slip upload), 3 (submitted / pending)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(1000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [showAmountPublicly, setShowAmountPublicly] = useState<boolean>(false);
  const [publicMessage, setPublicMessage] = useState<string>("");
  const [linkMerchant, setLinkMerchant] = useState<boolean>(false);
  const [linkMerchantPhone, setLinkMerchantPhone] = useState<string>("");
  const [contactPrivate, setContactPrivate] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  // Step 2 & 3 State
  const [createdRef, setCreatedRef] = useState<string>("");
  const [paymentOptions, setPaymentOptions] = useState<DonationPaymentOption[]>(
    initialPaymentOptions || [],
  );
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [txnReference, setTxnReference] = useState<string>("");
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refCopied, setRefCopied] = useState<boolean>(false);

  // Resume Modal State
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeCode, setResumeCode] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const getAmountCents = (): number => {
    if (selectedPreset === "custom") {
      const parsed = parseFloat(customAmount);
      return Math.round((isNaN(parsed) ? 0 : parsed) * 100);
    }
    return selectedPreset * 100;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountCents = getAmountCents();
    if (amountCents < 10000) {
      setErrorMessage(copy.amount.min);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createDonation({
        amountCents,
        displayName: isAnonymous ? null : displayName.trim() || null,
        isAnonymous,
        publicMessage: publicMessage.trim() || null,
        showAmountPublicly,
        contactPrivate: contactPrivate.trim() || null,
        linkMerchantPhone: linkMerchant ? linkMerchantPhone.trim() || null : null,
        turnstileToken: turnstileToken || "1x00000000000000000000AA",
      });

      setCreatedRef(res.referenceCode);
      if (res.paymentOptions && res.paymentOptions.length > 0) {
        setPaymentOptions(res.paymentOptions);
      }
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initialize donation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!slipFile) {
      setErrorMessage(copy.slip.label);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload slip to R2 presigned PUT
      const { key } = await presignAndUploadSlip(
        slipFile,
        createdRef,
        turnstileToken || undefined,
      );

      // 2. Submit confirmation to API
      await submitDonationSlip(createdRef, {
        slipKey: key,
        txnReference: txnReference.trim() || null,
      });

      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit donation slip.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(createdRef);
      }
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleResumeLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setResumeError(null);
    if (!resumeCode.trim()) return;

    setResumeLoading(true);
    try {
      const data = await fetchDonationStatus(resumeCode.trim());
      setCreatedRef(data.referenceCode);
      if (data.paymentOptions && data.paymentOptions.length > 0) {
        setPaymentOptions(data.paymentOptions);
      }
      if (data.status === "approved") {
        setIsApproved(true);
        setStep(3);
      } else if (data.status === "pending" || data.status === "rejected") {
        setStep(3);
      } else {
        setStep(2);
      }
      setResumeOpen(false);
    } catch (err: any) {
      setResumeError(err.message || "Donation not found.");
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <div className="w-full rounded-xl border border-hairline bg-surface-elevated/40 p-6 shadow-sm md:p-8">
      {/* Top Header & Resume trigger */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-hairline/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-gold/15 font-bold text-xs text-gold">
            {step === 3 ? "✓" : `0${step}`}
          </span>
          <span className="font-semibold text-text text-sm uppercase tracking-wide">
            {step === 1
              ? "Step 1: Choose Amount"
              : step === 2
                ? "Step 2: Bank Transfer & Slip"
                : "Confirmation"}
          </span>
        </div>

        {step === 1 && (
          <Dialog open={resumeOpen} onOpenChange={setResumeOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted hover:text-text"
              >
                <Search className="size-3.5 mr-1" />
                {copy.resume.button}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{copy.resume.title}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleResumeLookup} className="mt-3 space-y-4">
                <p className="text-xs text-muted">{copy.resume.prompt}</p>
                <Input
                  value={resumeCode}
                  onChange={(e) => setResumeCode(e.target.value.toUpperCase())}
                  placeholder={copy.resume.placeholder}
                  className="font-mono uppercase tracking-wider"
                />
                {resumeError && (
                  <p className="text-xs text-error">{resumeError}</p>
                )}
                <Button
                  type="submit"
                  variant="gold"
                  loading={resumeLoading}
                  className="w-full"
                >
                  {copy.resume.submit}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-error/40 bg-error/10 p-3.5 text-xs text-error">
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Details & Amount */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-6">
          {/* Amount selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-text">
              {copy.amount.label}
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    setSelectedPreset(amt);
                    setCustomAmount("");
                  }}
                  className={`flex h-12 cursor-pointer items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all ${
                    selectedPreset === amt
                      ? "border-gold bg-gold/15 text-gold shadow-xs"
                      : "border-hairline bg-surface text-text hover:border-azure/40 hover:bg-surface-elevated"
                  }`}
                >
                  Rs. {amt.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedPreset("custom")}
                className={`flex h-12 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                  selectedPreset === "custom"
                    ? "border-gold bg-gold/15 text-gold shadow-xs"
                    : "border-hairline bg-surface text-text hover:border-azure/40 hover:bg-surface-elevated"
                }`}
              >
                {copy.amount.custom}
              </button>
            </div>

            {selectedPreset === "custom" && (
              <div className="mt-2.5">
                <Input
                  type="number"
                  min="100"
                  step="50"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={copy.amount.customPlaceholder}
                  className="font-mono text-base"
                  required
                />
                <p className="mt-1 text-[11px] text-muted">{copy.amount.min}</p>
              </div>
            )}
          </div>

          {/* Name & Anonymous */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-text">
                {copy.name.label}
              </label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anonymous-toggle"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
                />
                <label
                  htmlFor="anonymous-toggle"
                  className="cursor-pointer text-xs font-medium text-muted hover:text-text select-none"
                >
                  {copy.anonymous}
                </label>
              </div>
            </div>

            {!isAnonymous && (
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={copy.name.placeholder}
                maxLength={80}
              />
            )}
          </div>

          {/* Public message & Show amount options */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-text">
              {copy.message.label}
            </label>
            <Textarea
              value={publicMessage}
              onChange={(e) => setPublicMessage(e.target.value)}
              placeholder={copy.message.placeholder}
              maxLength={140}
              rows={2}
            />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="show-amount-toggle"
                checked={showAmountPublicly}
                onCheckedChange={(checked) => setShowAmountPublicly(Boolean(checked))}
              />
              <label
                htmlFor="show-amount-toggle"
                className="cursor-pointer text-xs font-medium text-muted hover:text-text select-none"
              >
                {copy.showAmount}
              </label>
            </div>
          </div>

          {/* Link merchant shop */}
          <div className="rounded-lg border border-hairline/80 bg-surface/50 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="link-merchant-toggle"
                checked={linkMerchant}
                onCheckedChange={(checked) => setLinkMerchant(Boolean(checked))}
                className="mt-0.5"
              />
              <div>
                <label
                  htmlFor="link-merchant-toggle"
                  className="cursor-pointer font-medium text-text text-xs leading-normal select-none flex items-center gap-1.5"
                >
                  <Building2 className="size-3.5 text-gold" />
                  {copy.link.label}
                </label>
              </div>
            </div>

            {linkMerchant && (
              <div className="pl-6 pt-1 space-y-1">
                <label className="text-[11px] font-medium text-muted">
                  {copy.link.phone}
                </label>
                <Input
                  value={linkMerchantPhone}
                  onChange={(e) => setLinkMerchantPhone(e.target.value)}
                  placeholder={copy.link.phonePlaceholder}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* Private contact */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              {copy.contact.label}
            </label>
            <Input
              value={contactPrivate}
              onChange={(e) => setContactPrivate(e.target.value)}
              placeholder={copy.contact.placeholder}
              maxLength={120}
              className="text-xs"
            />
            <p className="text-[11px] text-muted">{copy.contact.help}</p>
          </div>

          {/* Turnstile Widget */}
          <div className="pt-2 flex justify-center">
            <TurnstileWidget action="donation" onToken={setTurnstileToken} />
          </div>

          {/* CTA: Strictly Gold, Never Green! */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={isSubmitting}
            className="w-full gap-2 text-base font-bold"
          >
            <Sparkles className="size-4" />
            {isSubmitting ? copy.creating : copy.create}
          </Button>
        </form>
      )}

      {/* STEP 2: Bank Transfer Details & Slip Upload */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-6">
          {/* Reference Banner */}
          <div className="rounded-lg border border-gold/40 bg-gold/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  Transfer Reference Code
                </span>
                <h3 className="font-mono text-2xl font-black tracking-wider text-text">
                  {createdRef}
                </h3>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyRef}
                className="gap-1.5 text-xs font-semibold"
              >
                {refCopied ? (
                  <>
                    <Check className="size-3.5 text-azure" />
                    {copy.bank.copied}
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    {copy.bank.copy}
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {copy.ref.help}
            </p>
          </div>

          {/* Bank details cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Transfer to any of the following accounts:
            </h4>
            <div className="space-y-4">
              {paymentOptions
                .filter((opt) => opt.isEnabled)
                .map((opt) => (
                  <BankDetailsCard key={opt.id} option={opt} copy={copy.bank} />
                ))}
            </div>
          </div>

          {/* Slip Dropzone */}
          <SlipDropzone
            file={slipFile}
            onFileSelect={setSlipFile}
            copy={copy.slip}
            disabled={isSubmitting}
          />

          {/* Bank Transaction Reference (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              {copy.txnRef.label}
            </label>
            <Input
              value={txnReference}
              onChange={(e) => setTxnReference(e.target.value)}
              placeholder={copy.txnRef.placeholder}
              maxLength={64}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted">{copy.txnRef.help}</p>
          </div>

          {/* CTA: Strictly Gold, Never Green! */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={isSubmitting}
            disabled={!slipFile}
            className="w-full gap-2 text-base font-bold"
          >
            <ArrowRight className="size-4" />
            {isSubmitting ? copy.submitting : copy.submit}
          </Button>
        </form>
      )}

      {/* STEP 3: Pending Confirmation */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-gold/20 text-gold">
            <CheckCircle className="size-8" />
          </div>
          <h3 className="text-xl font-bold text-text">
            {isApproved ? copy.approved.title : copy.pending.title}
          </h3>
          <p className="max-w-md text-xs leading-relaxed text-muted">
            {copy.pending.body}
          </p>
          <div className="mt-2 rounded border border-hairline bg-surface px-4 py-2 font-mono text-xs font-bold text-text">
            Reference: {createdRef}
          </div>
        </div>
      )}
    </div>
  );
}
