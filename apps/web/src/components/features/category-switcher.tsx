"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Pill,
  Wrench,
  Shirt,
  Scale,
  Zap,
  Database,
  Languages,
  Clock,
  Search,
  ReceiptText,
  CreditCard,
  Layers,
  FileSpreadsheet,
  Tag,
  RotateCcw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

export type CategoryKey = "grocery" | "pharmacy" | "hardware" | "apparel";

interface CategoryData {
  id: CategoryKey;
  icon: typeof ShoppingCart;
  labelKey: string;
  headlineKey: string;
  problemKey: string;
  solutionKey: string;
  features: {
    icon: typeof Scale;
    titleKey: string;
    descKey: string;
    tagKey: string;
  }[];
}

const CATEGORIES: CategoryData[] = [
  {
    id: "grocery",
    icon: ShoppingCart,
    labelKey: "categories.grocery.label",
    headlineKey: "categories.grocery.headline",
    problemKey: "categories.grocery.problem",
    solutionKey: "categories.grocery.solution",
    features: [
      {
        icon: Scale,
        titleKey: "categories.grocery.f1_title",
        descKey: "categories.grocery.f1_desc",
        tagKey: "categories.grocery.f1_tag",
      },
      {
        icon: Zap,
        titleKey: "categories.grocery.f2_title",
        descKey: "categories.grocery.f2_desc",
        tagKey: "categories.grocery.f2_tag",
      },
      {
        icon: Database,
        titleKey: "categories.grocery.f3_title",
        descKey: "categories.grocery.f3_desc",
        tagKey: "categories.grocery.f3_tag",
      },
      {
        icon: Languages,
        titleKey: "categories.grocery.f4_title",
        descKey: "categories.grocery.f4_desc",
        tagKey: "categories.grocery.f4_tag",
      },
    ],
  },
  {
    id: "pharmacy",
    icon: Pill,
    labelKey: "categories.pharmacy.label",
    headlineKey: "categories.pharmacy.headline",
    problemKey: "categories.pharmacy.problem",
    solutionKey: "categories.pharmacy.solution",
    features: [
      {
        icon: Clock,
        titleKey: "categories.pharmacy.f1_title",
        descKey: "categories.pharmacy.f1_desc",
        tagKey: "categories.pharmacy.f1_tag",
      },
      {
        icon: Search,
        titleKey: "categories.pharmacy.f2_title",
        descKey: "categories.pharmacy.f2_desc",
        tagKey: "categories.pharmacy.f2_tag",
      },
      {
        icon: CreditCard,
        titleKey: "categories.pharmacy.f3_title",
        descKey: "categories.pharmacy.f3_desc",
        tagKey: "categories.pharmacy.f3_tag",
      },
      {
        icon: ReceiptText,
        titleKey: "categories.pharmacy.f4_title",
        descKey: "categories.pharmacy.f4_desc",
        tagKey: "categories.pharmacy.f4_tag",
      },
    ],
  },
  {
    id: "hardware",
    icon: Wrench,
    labelKey: "categories.hardware.label",
    headlineKey: "categories.hardware.headline",
    problemKey: "categories.hardware.problem",
    solutionKey: "categories.hardware.solution",
    features: [
      {
        icon: Layers,
        titleKey: "categories.hardware.f1_title",
        descKey: "categories.hardware.f1_desc",
        tagKey: "categories.hardware.f1_tag",
      },
      {
        icon: FileSpreadsheet,
        titleKey: "categories.hardware.f2_title",
        descKey: "categories.hardware.f2_desc",
        tagKey: "categories.hardware.f2_tag",
      },
      {
        icon: ReceiptText,
        titleKey: "categories.hardware.f3_title",
        descKey: "categories.hardware.f3_desc",
        tagKey: "categories.hardware.f3_tag",
      },
      {
        icon: Database,
        titleKey: "categories.hardware.f4_title",
        descKey: "categories.hardware.f4_desc",
        tagKey: "categories.hardware.f4_tag",
      },
    ],
  },
  {
    id: "apparel",
    icon: Shirt,
    labelKey: "categories.apparel.label",
    headlineKey: "categories.apparel.headline",
    problemKey: "categories.apparel.problem",
    solutionKey: "categories.apparel.solution",
    features: [
      {
        icon: Tag,
        titleKey: "categories.apparel.f1_title",
        descKey: "categories.apparel.f1_desc",
        tagKey: "categories.apparel.f1_tag",
      },
      {
        icon: RotateCcw,
        titleKey: "categories.apparel.f2_title",
        descKey: "categories.apparel.f2_desc",
        tagKey: "categories.apparel.f2_tag",
      },
      {
        icon: Layers,
        titleKey: "categories.apparel.f3_title",
        descKey: "categories.apparel.f3_desc",
        tagKey: "categories.apparel.f3_tag",
      },
      {
        icon: Zap,
        titleKey: "categories.apparel.f4_title",
        descKey: "categories.apparel.f4_desc",
        tagKey: "categories.apparel.f4_tag",
      },
    ],
  },
];

export function CategorySwitcher() {
  const t = useTranslations("featuresPage");
  const [activeTab, setActiveTab] = useState<CategoryKey>("grocery");

  const currentCategory: CategoryData = CATEGORIES.find((c) => c.id === activeTab) ?? CATEGORIES[0]!;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Category selector pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-8 sm:gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "inline-flex items-center gap-2.5 rounded border px-4 py-2.5 text-xs font-medium transition-all sm:text-sm",
                isActive
                  ? "border-azure bg-azure/10 text-azure-text shadow-[0_0_15px_-3px_var(--glow-azure)]"
                  : "border-hairline bg-surface/60 text-muted hover:border-hairline-strong hover:bg-surface-elevated hover:text-text",
              )}
            >
              <Icon className={cn("size-4 shrink-0", isActive ? "text-azure" : "text-muted")} />
              <span>{t(cat.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Category content container */}
      <Reveal key={activeTab}>
        <div className="border-hairline bg-surface/40 rounded-lg border p-6 sm:p-8 lg:p-10">
          {/* Header & shop challenge breakdown */}
          <div className="border-hairline-grid mb-8 border-b pb-8">
            <span className="text-azure-text font-mono text-xs font-semibold tracking-wider uppercase">
              {t(currentCategory.labelKey)}
            </span>
            <h2 className="text-display text-text mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {t(currentCategory.headlineKey)}
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border-hairline bg-surface-legal/60 rounded border p-4">
                <span className="text-error font-mono text-[11px] font-semibold tracking-wide uppercase">
                  {t("challengeLabel")}
                </span>
                <p className="text-muted mt-1.5 text-xs leading-relaxed sm:text-sm">
                  {t(currentCategory.problemKey)}
                </p>
              </div>
              <div className="border-azure/30 bg-azure/5 rounded border p-4">
                <span className="text-azure-text font-mono text-[11px] font-semibold tracking-wide uppercase">
                  {t("solutionLabel")}
                </span>
                <p className="text-text mt-1.5 text-xs leading-relaxed sm:text-sm">
                  {t(currentCategory.solutionKey)}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Feature cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {currentCategory.features.map((feat, idx) => {
              const FeatIcon = feat.icon;
              return (
                <div
                  key={idx}
                  className="border-hairline bg-surface/80 hover:border-azure/40 flex flex-col justify-between rounded border p-5 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="border-hairline bg-surface-elevated flex size-9 items-center justify-center rounded border">
                        <FeatIcon className="text-azure size-4" />
                      </div>
                      <span className="border-hairline text-muted bg-surface-elevated/50 rounded border px-2 py-0.5 font-mono text-[10px]">
                        {t(feat.tagKey)}
                      </span>
                    </div>

                    <h3 className="text-text mt-4 text-sm font-semibold">{t(feat.titleKey)}</h3>
                    <p className="text-muted mt-2 text-xs leading-relaxed">{t(feat.descKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
