"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { HeartHandshake } from "lucide-react";
import { DonationCard } from "./DonationCard";
import { TransparencyStrip } from "./TransparencyStrip";
import { SupportersWall } from "./SupportersWall";
import { fetchDonationSummary } from "../api";
import type { DonationSummary } from "../types";

export function DonationView() {
  const t = useTranslations("donate");

  const [summary, setSummary] = useState<DonationSummary>({
    monthlyTotalCents: 0,
    totalSupportersCount: 0,
    supporters: [],
    paymentOptions: [],
  });

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const data = await fetchDonationSummary();
        if (!cancelled && data) {
          setSummary(data);
        }
      } catch (err) {
        console.error("Failed to load donation summary:", err);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyForCard = {
    amount: {
      label: t("amount.label"),
      custom: t("amount.custom"),
      customPlaceholder: t("amount.customPlaceholder"),
      min: t("amount.min"),
    },
    name: {
      label: t("name.label"),
      placeholder: t("name.placeholder"),
    },
    anonymous: t("anonymous"),
    message: {
      label: t("message.label"),
      placeholder: t("message.placeholder"),
    },
    showAmount: t("showAmount"),
    link: {
      label: t("link.label"),
      phone: t("link.phone"),
      phonePlaceholder: t("link.phonePlaceholder"),
    },
    contact: {
      label: t("contact.label"),
      placeholder: t("contact.placeholder"),
      help: t("contact.help"),
    },
    create: t("create"),
    creating: t("creating"),
    ref: {
      title: t("ref.title"),
      help: t("ref.help"),
    },
    bank: {
      accountName: t("bank.accountName"),
      accountNumber: t("bank.accountNumber"),
      bank: t("bank.bank"),
      branch: t("bank.branch"),
      notes: t("bank.notes"),
      copy: t("bank.copy"),
      copied: t("bank.copied"),
      scanQr: t("bank.scanQr"),
      scanQrHelp: t("bank.scanQrHelp"),
    },
    slip: {
      label: t("slip.label"),
      help: t("slip.help"),
      drag: t("slip.drag"),
      uploaded: t("slip.uploaded"),
      uploading: t("slip.uploading"),
    },
    txnRef: {
      label: t("txnRef.label"),
      placeholder: t("txnRef.placeholder"),
      help: t("txnRef.help"),
    },
    submit: t("submit"),
    submitting: t("submitting"),
    pending: {
      title: t("pending.title"),
      body: t("pending.body"),
    },
    approved: {
      title: t("approved.title"),
    },
    resume: {
      button: t("resume.button"),
      title: t("resume.title"),
      prompt: t("resume.prompt"),
      placeholder: t("resume.placeholder"),
      submit: t("resume.submit"),
    },
  };

  const copyForTransparency = {
    title: t("transparency.title"),
    body: t("transparency.body"),
    fundsTitle: t("funds.title"),
    fundsCert: t("funds.cert"),
    fundsHardware: t("funds.hardware"),
    fundsI18n: t("funds.i18n"),
    fundsInfra: t("funds.infra"),
  };

  const copyForWall = {
    title: t("wall.title"),
    empty: t("wall.empty"),
    anonymous: t("wall.anonymous"),
    goldSupporter: t("wall.goldSupporter"),
  };

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* S09 Hero Section */}
      <div className="mb-12 text-center">
        <span className="text-gold mb-3 block font-mono text-xs font-semibold tracking-wider uppercase">
          CEYBYTE COMMUNITY FUNDING
        </span>
        <div className="border-gold/40 bg-gold/10 text-gold mb-4 inline-flex size-12 items-center justify-center rounded-[--radius-md] border">
          <HeartHandshake className="size-6" />
        </div>
        <h1 className="text-display text-text text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {t("title")}
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">{t("lead")}</p>
      </div>

      {/* S09 Section 1: Transparency Strip & Monthly Live Total */}
      <div className="mb-10">
        <TransparencyStrip
          monthlyTotalCents={summary.monthlyTotalCents}
          totalSupportersCount={summary.totalSupportersCount}
          copy={copyForTransparency}
        />
      </div>

      {/* S09 Section 2: Two-Step Interactive Donation Card */}
      <div className="mb-14">
        <DonationCard initialPaymentOptions={summary.paymentOptions} copy={copyForCard} />
      </div>

      {/* S09 Section 3: Supporters Wall */}
      <div className="mb-14">
        <SupportersWall supporters={summary.supporters} copy={copyForWall} />
      </div>

      {/* S09 Section 4: Legal & Statutory Disclaimer */}
      <div className="border-hairline/60 bg-surface/30 rounded-[--radius-md] border p-4 text-center">
        <p className="text-muted mx-auto max-w-2xl text-xs leading-relaxed">{t("legal")}</p>
      </div>
    </div>
  );
}
