"use client";

import React, { useState } from "react";
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
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import type { DocCategory, DocArticle } from "../source";

interface ArticleSidebarProps {
  categories: DocCategory[];
  articles: DocArticle[];
  currentCategorySlug: string;
  currentArticleSlug: string;
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

export function ArticleSidebar({
  categories,
  articles,
  currentCategorySlug,
  currentArticleSlug,
  locale,
}: ArticleSidebarProps) {
  // Keep active category expanded by default
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    [currentCategorySlug]: true,
  });

  function toggleCategory(slug: string) {
    setOpenCategories((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  }

  return (
    <aside
      aria-label="Documentation navigation"
      className="flex h-full w-full flex-col space-y-6"
    >
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <Link
          href={`/${locale}/docs`}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-azure"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Docs Hub</span>
        </Link>
        <span className="font-mono text-[10px] uppercase text-text-muted/60">
          CB POS Help
        </span>
      </div>

      <nav className="space-y-4 text-xs">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || BookOpen;
          const categoryArticles = articles.filter((a) => a.categorySlug === cat.slug);
          if (categoryArticles.length === 0) return null;

          const isCurrentCategory = cat.slug === currentCategorySlug;
          const isOpen = openCategories[cat.slug] ?? isCurrentCategory;

          return (
            <div key={cat.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleCategory(cat.slug)}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-medium transition-colors ${
                  isCurrentCategory
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-text-muted" />
                  <span>{cat.title}</span>
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-text-muted transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <ul className="ml-3 space-y-0.5 border-l border-hairline pl-2">
                  {categoryArticles.map((art) => {
                    const isActive =
                      cat.slug === currentCategorySlug && art.slug === currentArticleSlug;

                    return (
                      <li key={art.id}>
                        <Link
                          href={`/${locale}/docs/${cat.slug}/${art.slug}`}
                          className={`block rounded py-1 pl-2 text-xs transition-colors ${
                            isActive
                              ? "border-l-2 border-azure font-medium text-azure bg-azure/5 -ml-[9px] pl-[7px]"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          <div className="flex items-center justify-between pr-2">
                            <span className="truncate">{art.title}</span>
                            {art.isFallback && (
                              <span className="rounded border border-azure/30 bg-azure/10 px-1 py-0.2 font-mono text-[9px] text-azure">
                                EN
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
