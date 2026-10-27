"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DonationCard } from "./DonationCard";
import { TransparencyStrip } from "./TransparencyStrip";
import { SupportersWall } from "./SupportersWall";
import { DonationFigure } from "./DonationFigure";
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
      title: t.raw("ref.title") as string,
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
      uploaded: t.raw("slip.uploaded") as string,
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
    body: t.raw("transparency.body") as string,
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
      {/* S09 Releases-Matched Monolith Header Card with Isometric Hairline Element */}
      <div className="border-hairline bg-surface group relative mb-12 overflow-hidden rounded-2xl p-6 shadow-2xl sm:p-10">
        {/* Isometric Hairline Hardware Element */}
        <DonationFigure className="pointer-events-none absolute -top-10 -right-10 w-[340px] opacity-30 group-hover:opacity-85 sm:top-1/2 sm:-right-6 sm:w-[460px] sm:-translate-y-1/2 sm:opacity-60 md:right-0 lg:right-4 lg:w-[500px]" />

        {/* Content on the Left */}
        <div className="relative z-10 max-w-xl space-y-3">
          <h1 className="text-text text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            {t("title")}
          </h1>
          <p className="text-muted text-sm leading-relaxed sm:text-base">{t("lead")}</p>
          <div className="text-muted flex flex-wrap items-center gap-3 pt-2 font-mono text-xs sm:gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true"></span>
              <span>100% Open &amp; Audited</span>
            </span>
            <span aria-hidden="true">•</span>
            <span className="flex items-center gap-1.5">
              <span className="bg-gold size-1.5 rounded-full" aria-hidden="true"></span>
              <span>Community Backed</span>
            </span>
            <span aria-hidden="true">•</span>
            <span className="text-text-secondary flex items-center gap-1.5">Commercial Bank Wire</span>
          </div>
        </div>
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
