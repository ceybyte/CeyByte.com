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

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
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
    <div className="bg-background min-h-screen pb-20">
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12 md:py-16">
        {/* Header Strip */}
        <div className="flex flex-col justify-between gap-6 border-b border-zinc-800 pb-8 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 font-mono text-xs tracking-wider text-cyan-400 uppercase">
              <span>CB POS EDITORIAL</span>
            </div>
            <h1 className="text-foreground text-3xl font-extrabold tracking-tight md:text-5xl">
              {t("title")}
            </h1>
            <p className="text-base leading-relaxed text-zinc-400 md:text-lg">{t("lead")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/blog/rss.xml`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 font-mono text-xs text-zinc-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
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
