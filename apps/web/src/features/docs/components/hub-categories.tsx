"use client";

import React from "react";
import Link from "next/link";
import {
  Rocket,
  ShoppingCart,
  Package,
  Percent,
  Printer,
  ReceiptText,
  DatabaseBackup,
  Network,
  Wrench,
  History,
  BookOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { DocCategory, DocArticle } from "../source";

interface HubCategoriesProps {
  categories: DocCategory[];
  articles: DocArticle[];
  locale: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  ShoppingCart,
  Package,
  Percent,
  Printer,
  ReceiptText,
  DatabaseBackup,
  Network,
  Wrench,
  History,
};

export function HubCategories({ categories, articles, locale }: HubCategoriesProps) {
  const t = useTranslations("docs");

  return (
    <div className="relative">
      {/* Corner Crosshairs */}
      <div className="pointer-events-none absolute -left-2 -top-2 select-none font-mono text-xs text-hairline-grid">
        +
      </div>
      <div className="pointer-events-none absolute -right-2 -top-2 select-none font-mono text-xs text-hairline-grid">
        +
      </div>
      <div className="pointer-events-none absolute -bottom-2 -left-2 select-none font-mono text-xs text-hairline-grid">
        +
      </div>
      <div className="pointer-events-none absolute -bottom-2 -right-2 select-none font-mono text-xs text-hairline-grid">
        +
      </div>

      {/* 5x2 Category Grid with Shared Hairlines */}
      <div className="grid grid-cols-1 divide-y divide-hairline border border-hairline bg-hairline sm:grid-cols-2 sm:gap-px sm:divide-y-0 lg:grid-cols-5">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || BookOpen;
          const categoryArticles = articles.filter((a) => a.categorySlug === cat.slug);
          const articleCount = categoryArticles.length;
          const firstArticle = categoryArticles[0];
          const href = firstArticle
            ? `/${locale}/docs/${cat.slug}/${firstArticle.slug}`
            : `/${locale}/docs/${cat.slug}`;

          return (
            <Link
              key={cat.id}
              href={href}
              className="group relative flex flex-col justify-between bg-surface p-4 transition-colors hover:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-azure"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-7 w-7 items-center justify-center rounded border border-hairline bg-surface-elevated text-text-muted transition-colors group-hover:border-azure/40 group-hover:text-azure">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {cat.slug === "tax" && (
                    <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-amber-400">
                      {t("categoryTaxDisclaimer")}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text-primary transition-colors group-hover:text-azure">
                    {cat.title}
                  </h3>
                  {cat.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">{cat.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-hairline/60 pt-2 text-[11px] font-mono text-text-muted">
                <span>
                  {articleCount} {articleCount === 1 ? "guide" : "guides"}
                </span>
                <span className="text-azure opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
