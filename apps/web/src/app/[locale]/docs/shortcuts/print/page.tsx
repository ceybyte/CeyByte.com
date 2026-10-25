"use client";

import React, { use } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ShortcutsTable } from "@/features/docs/components/shortcuts-table";

interface PrintPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function PrintableShortcutsPage({ params }: PrintPageProps) {
  const { locale } = use(params);
  const t = useTranslations("docs.shortcuts");

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 print:p-0 print:max-w-none">
      {/* Top action bar (hidden during print) */}
      <div className="mb-8 flex items-center justify-between border-b border-hairline pb-4 print:hidden">
        <Link
          href={`/${locale}/docs`}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-azure"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Docs Hub</span>
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg border border-azure/40 bg-azure/10 px-4 py-2 text-xs font-semibold text-azure transition-colors hover:bg-azure/20 focus:outline-none focus:ring-1 focus:ring-azure"
        >
          <Printer className="h-4 w-4" />
          <span>{t("printButton")}</span>
        </button>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="space-y-6 print:space-y-4">
        {/* Printable Header */}
        <div className="flex flex-col gap-2 border-b-2 border-azure pb-4 print:border-black">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold tracking-tight text-text-primary print:text-black sm:text-2xl">
              CB POS
            </div>
            <span className="font-mono text-xs font-medium uppercase text-text-muted print:text-black">
              Cashier Keymap [B1]
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary print:text-black">
              {t("printTitle")}
            </h1>
            <p className="text-xs text-text-muted print:text-gray-600">
              {t("printSubtitle")}
            </p>
          </div>
        </div>

        {/* Shortcuts Table */}
        <ShortcutsTable />

        {/* Printable Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-hairline pt-3 font-mono text-[11px] text-text-muted print:mt-4 print:border-black print:text-black">
          <span>CB POS · 100% Free POS for Sri Lanka</span>
          <span>ceybyte.com</span>
        </div>
      </div>
    </div>
  );
}
