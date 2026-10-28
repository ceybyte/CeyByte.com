import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, ArrowLeft, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCategories, getArticles, getCategoryBySlug } from "@/features/docs/source";
import { DocsHubSearchClient } from "@/features/docs/components/docs-hub-client";

interface CategoryPageProps {
  params: Promise<{
    locale: string;
    category: string;
  }>;
}

export function generateStaticParams() {
  const categories = getCategories("en");
  const params: { locale: string; category: string }[] = [];

  for (const locale of routing.locales) {
    for (const cat of categories) {
      params.push({
        locale,
        category: cat.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { locale, category } = await params;
  const cat = getCategoryBySlug(category, locale);
  if (!cat) return {};

  return {
    title: `${cat.title} | CB POS Help`,
    description: cat.description || `Documentation and guides for ${cat.title}`,
  };
}

export default async function DocCategoryPage({ params }: CategoryPageProps) {
  const { locale, category } = await params;
  const cat = getCategoryBySlug(category, locale);
  if (!cat) notFound();

  const articles = getArticles(locale).filter((a) => a.categorySlug === category);

  // If there are articles, automatically redirect to the first guide in this category
  const firstArticle = articles[0];
  if (firstArticle) {
    redirect(`/${locale}/docs/${category}/${firstArticle.slug}`);
  }

  const t = await getTranslations({ locale, namespace: "docs" });

  return (
    <div className="bg-canvas min-h-screen text-text">
      {/* Top Search Bar */}
      <div className="border-b border-hairline bg-surface/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/docs`}
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-azure transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t("hub.title")}</span>
          </Link>
          <div className="w-64 sm:w-80">
            <DocsHubSearchClient locale={locale} />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-mono text-text-muted">
          <Link href={`/${locale}/docs`} className="hover:text-azure transition-colors">
            Docs
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-text">{cat.title}</span>
        </nav>

        <div className="rounded-xl border border-hairline bg-surface p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-hairline bg-surface-elevated text-azure">
            <BookOpen className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {cat.title}
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">
            {cat.description || "Guides for this section are being written and verified with the latest CB POS release."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/docs`}
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-elevated px-4 py-2 text-xs font-semibold text-text hover:border-azure/40 hover:text-azure transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to all guides</span>
            </Link>
            <Link
              href={`/${locale}/docs/getting-started/install`}
              className="inline-flex items-center gap-2 rounded-lg bg-azure px-4 py-2 text-xs font-semibold text-white hover:bg-azure-500 transition-colors"
            >
              <span>Get started with CB POS</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
