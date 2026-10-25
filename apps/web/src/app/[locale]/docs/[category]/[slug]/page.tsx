import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, ArrowRight, Calendar, Laptop } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { processMarkdown } from "@cbpos/shared/markdown";
import {
  getCategories,
  getArticles,
  getArticle,
  getCategoryBySlug,
  getDocsNavigation,
  isTaxArticle,
} from "@/features/docs/source";
import { ArticleSidebar } from "@/features/docs/components/article-sidebar";
import { ArticleToc } from "@/features/docs/components/article-toc";
import { ArticleFeedback } from "@/features/docs/components/article-feedback";
import { FallbackBanner } from "@/features/docs/components/fallback-banner";
import { TaxDisclaimerCallout } from "@/features/docs/components/tax-disclaimer-callout";
import { MarkdownRenderer } from "@/features/docs/components/markdown-renderer";
import { DocsHubSearchClient } from "@/features/docs/components/docs-hub-client";

interface DocPageProps {
  params: Promise<{
    locale: string;
    category: string;
    slug: string;
  }>;
}

export function generateStaticParams() {
  const articles = getArticles("en");
  const locales = ["en", "si", "ta"];
  const params: { locale: string; category: string; slug: string }[] = [];

  for (const locale of locales) {
    for (const art of articles) {
      params.push({
        locale,
        category: art.categorySlug,
        slug: art.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: DocPageProps) {
  const { locale, category, slug } = await params;
  const article = getArticle(category, slug, locale);
  if (!article) return {};

  return {
    title: `${article.title} | CB POS Help`,
    description: article.summary,
  };
}

export default async function DocArticlePage({ params }: DocPageProps) {
  const { locale, category, slug } = await params;
  const t = await getTranslations({ locale, namespace: "docs" });

  const article = getArticle(category, slug, locale);
  if (!article) notFound();

  const categories = getCategories(locale);
  const articles = getArticles(locale);
  const currentCategory = getCategoryBySlug(category, locale);
  const navigation = getDocsNavigation(category, slug, locale);
  const isTax = isTaxArticle(article);

  // Strip leading H1 from markdown so the page maintains exactly ONE <h1> element (AC-05.3)
  const cleanBodyMd = article.bodyMd.replace(/^#\s+[^\n]+\n+/, "");
  const { html, toc } = await processMarkdown(cleanBodyMd, {
    locale,
    autoTaxDisclaimer: false,
  });

  const updatedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "25 Oct 2026";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search trigger & breadcrumb top bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
          <Link href={`/${locale}/docs`} className="hover:text-azure">
            Docs
          </Link>
          <ChevronRight className="h-3 w-3 text-text-muted/60" />
          <span className="hover:text-text-primary">
            {currentCategory?.title || category}
          </span>
          <ChevronRight className="h-3 w-3 text-text-muted/60" />
          <span className="text-text-primary font-medium truncate max-w-[200px]">
            {article.title}
          </span>
        </nav>
        <div className="w-full sm:w-72">
          <DocsHubSearchClient locale={locale} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_220px]">
        {/* Left Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4">
            <ArticleSidebar
              categories={categories}
              articles={articles}
              currentCategorySlug={category}
              currentArticleSlug={slug}
              locale={locale}
            />
          </div>
        </div>

        {/* Center Main Article */}
        <main className="min-w-0 max-w-3xl">
          {/* Fallback Banner for untranslated articles */}
          {article.isFallback && <FallbackBanner locale={locale} />}

          {/* Tax Disclaimer Callout for tax articles (FR-05.4) */}
          {isTax && <TaxDisclaimerCallout locale={locale} />}

          {/* Single H1 Heading (AC-05.3) */}
          <div className="space-y-3 pb-6 border-b border-hairline">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-sm text-text-muted leading-relaxed">
                {article.summary}
              </p>
            )}

            {/* Badges (Version & Date) */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-text-muted">
              <div className="inline-flex items-center gap-1.5 rounded border border-hairline bg-surface px-2 py-0.5">
                <Laptop className="h-3 w-3 text-azure" />
                <span>{t("article.appliesTo", { version: "v1.3+" })}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded border border-hairline bg-surface px-2 py-0.5">
                <Calendar className="h-3 w-3 text-text-muted" />
                <span>{t("article.updated", { date: updatedDate })}</span>
              </div>
            </div>
          </div>

          {/* Rendered Prose Content */}
          <div className="py-6">
            <MarkdownRenderer html={html} />
          </div>

          {/* Prev / Next Navigation */}
          <div className="mt-12 grid grid-cols-1 gap-4 border-t border-hairline pt-6 sm:grid-cols-2">
            {navigation.prev ? (
              <Link
                href={`/${locale}/docs/${navigation.prev.categorySlug}/${navigation.prev.slug}`}
                className="group flex flex-col rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-azure/50 hover:bg-surface-elevated"
              >
                <span className="flex items-center gap-1 font-mono text-xs text-text-muted group-hover:text-azure">
                  <ArrowLeft className="h-3 w-3" />
                  <span>{t("article.prev")}</span>
                </span>
                <span className="mt-1 text-sm font-medium text-text-primary group-hover:text-azure">
                  {navigation.prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {navigation.next ? (
              <Link
                href={`/${locale}/docs/${navigation.next.categorySlug}/${navigation.next.slug}`}
                className="group flex flex-col items-end text-right rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-azure/50 hover:bg-surface-elevated"
              >
                <span className="flex items-center gap-1 font-mono text-xs text-text-muted group-hover:text-azure">
                  <span>{t("article.next")}</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
                <span className="mt-1 text-sm font-medium text-text-primary group-hover:text-azure">
                  {navigation.next.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>

          {/* Helpful Feedback Widget */}
          <div className="mt-8">
            <ArticleFeedback articleSlug={slug} categorySlug={category} locale={locale} />
          </div>
        </main>

        {/* Right TOC Column (xl+ screens) */}
        <div className="hidden xl:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pl-4">
            <ArticleToc items={toc} />
          </div>
        </div>
      </div>
    </div>
  );
}
