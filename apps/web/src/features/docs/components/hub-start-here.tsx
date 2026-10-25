"use client";

import React from "react";
import Link from "next/link";
import { Download, ShieldAlert, KeyRound, Printer, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface HubStartHereProps {
  locale: string;
}

export function HubStartHere({ locale }: HubStartHereProps) {
  const t = useTranslations("docs.startHere");

  const cards = [
    {
      title: t("install"),
      href: `/${locale}/docs/getting-started/install`,
      icon: Download,
      desc: "Download and 2-min setup",
    },
    {
      title: t("smartscreen"),
      href: `/${locale}/docs/getting-started/smartscreen`,
      icon: ShieldAlert,
      desc: "Windows prompt explanation",
    },
    {
      title: t("login"),
      href: `/${locale}/docs/getting-started/first-login`,
      icon: KeyRound,
      desc: "Default PIN 1234 & security",
    },
    {
      title: t("printer"),
      href: `/${locale}/docs/hardware/receipt-printer`,
      icon: Printer,
      desc: "58mm/80mm ESC/POS setup",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono font-medium uppercase tracking-wider text-text-muted">
          {t("title")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group relative flex flex-col justify-between rounded-md border border-hairline bg-surface p-4 transition-all hover:border-azure/60 hover:bg-surface-elevated hover:shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex h-8 w-8 items-center justify-center rounded border border-hairline bg-surface-elevated text-azure transition-colors group-hover:border-azure/40">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary group-hover:text-azure">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">{c.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-mono text-text-muted group-hover:text-azure">
                <span>Read guide</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
