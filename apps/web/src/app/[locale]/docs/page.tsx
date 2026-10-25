import React from "react";
import Link from "next/link";
import { MessageSquare, MessageCircleQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCategories, getArticles } from "@/features/docs/source";
import { HubStartHere } from "@/features/docs/components/hub-start-here";
import { HubCategories } from "@/features/docs/components/hub-categories";
import { DocsHubSearchClient } from "@/features/docs/components/docs-hub-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docs.hub" });

  return {
    title: `${t("title")} | CB POS`,
    description: t("lead"),
  };
}

export default async function DocsHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docs" });
  const categories = getCategories(locale);
  const articles = getArticles(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header & Search Trigger */}
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-azure/30 bg-azure/10 px-3 py-1 font-mono text-xs text-azure">
          <span>Documentation & Guides</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          {t("hub.title")}
        </h1>
        <p className="max-w-2xl text-sm text-text-muted sm:text-base">
          {t("hub.lead")}
        </p>

        <div className="pt-2 w-full flex justify-center">
          <DocsHubSearchClient locale={locale} />
        </div>
      </div>

      {/* Start Here Row */}
      <section className="mt-12">
        <HubStartHere locale={locale} />
      </section>

      {/* 5x2 Category Grid */}
      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-medium uppercase tracking-wider text-text-muted">
            Explore by topic
          </h2>
          <Link
            href={`/${locale}/docs/shortcuts/print`}
            className="text-xs font-mono text-azure hover:underline"
          >
            Cashiering shortcuts card →
          </Link>
        </div>
        <HubCategories categories={categories} articles={articles} locale={locale} />
      </section>

      {/* Help Strip */}
      <section className="mt-16 rounded-xl border border-hairline bg-surface p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h3 className="text-base font-medium text-text-primary">
              {t("help.title")}
            </h3>
            <p className="text-sm text-text-muted">
              {t("help.body")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://chat.whatsapp.com/CB-POS-Community"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:border-azure/50 hover:bg-surface"
            >
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              <span>{t("help.whatsapp")}</span>
            </a>
            <Link
              href={`/${locale}/feedback/new?type=question`}
              className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:border-azure/50 hover:bg-surface"
            >
              <MessageCircleQuestion className="h-4 w-4 text-azure" />
              <span>{t("help.ticket")}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
