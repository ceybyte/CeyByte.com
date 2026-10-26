import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Rss } from "lucide-react";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { getBlogPosts, getAlsoInEnglishPosts } from "@/features/blog/source";
import { BlogView } from "@/features/blog/components/BlogView";
import type { TagItem } from "@/features/blog/types";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return buildMetadata({
    locale,
    path: "/blog",
    title: t("title"),
    description: t("lead"),
  });
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  const posts = getBlogPosts(locale);
  const alsoInEnglishPosts = getAlsoInEnglishPosts(locale);

  const tagItems: TagItem[] = [
    { key: "all", label: t("tags.all") },
    { key: "releases", label: t("tags.releases") },
    { key: "tax", label: t("tags.tax") },
    { key: "stories", label: t("tags.stories") },
    { key: "hardware", label: t("tags.hardware") },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-12">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <span>CB POS EDITORIAL</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
              {t("lead")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/blog/rss.xml`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-mono text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
            >
              <Rss className="h-4 w-4 text-cyan-400" />
              <span>{t("rss")}</span>
            </Link>
          </div>
        </div>

        {/* Interactive Blog View with Tag Filtering */}
        <BlogView
          posts={posts}
          alsoInEnglishPosts={alsoInEnglishPosts}
          locale={locale}
          tagItems={tagItems}
          copy={{
            empty: t("empty"),
            featured: t("featured"),
            alsoInEnglish: t("alsoInEnglish"),
            alsoInEnglishLead: t("alsoInEnglishLead"),
          }}
        />
      </main>
    </div>
  );
}
