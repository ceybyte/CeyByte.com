import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { getBlogPostBySlug, getAllBlogSlugs, getRelatedPosts } from "@/features/blog/source";
import { AlsoInEnglishBanner } from "@/features/blog/components/AlsoInEnglishBanner";
import { ShareButtons } from "@/features/blog/components/ShareButtons";
import { RelatedPosts } from "@/features/blog/components/RelatedPosts";

export function generateStaticParams() {
  const allSlugs = getAllBlogSlugs();
  const distinctSlugs = Array.from(new Set(allSlugs.map((s) => s.slug)));

  // Generate paths for all slugs across all 3 locales
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of routing.locales) {
    for (const slug of distinctSlugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPostBySlug(slug, locale);
  if (!post) return {};

  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.title,
    description: post.excerpt,
    ogImage: post.ogImageKey || undefined,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  const post = getBlogPostBySlug(slug, locale);
  if (!post) {
    notFound();
  }

  const dateFormatted = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === "en" ? "en-US" : locale === "si" ? "si-LK" : "ta-LK", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const related = getRelatedPosts(post.slug, post.tags, locale, 2);
  const currentUrl = `https://ceybyte.com/${locale}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    author: {
      "@type": "Organization",
      name: "Ceylon Byte",
      url: "https://ceybyte.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Ceylon Byte",
      logo: {
        "@type": "ImageObject",
        url: "https://ceybyte.com/brand/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": currentUrl,
    },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-cyan-400 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>{t("backToBlog")}</span>
          </Link>
        </div>

        {/* Fallback Banner for untranslated articles */}
        {post.isFallback && (
          <AlsoInEnglishBanner
            title={t("alsoInEnglish")}
            lead={t("alsoInEnglishLead")}
          />
        )}

        {/* Article Header */}
        <header className="space-y-6 pb-10 border-b border-zinc-800">
          {/* Metadata Strip */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
            {post.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="h-3.5 w-3.5 text-cyan-400" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 text-cyan-300 font-semibold uppercase text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {dateFormatted && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <span>{dateFormatted}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Clock className="h-3.5 w-3.5" />
              <span>{t("readingTime", { minutes: post.readingMinutes })}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed font-normal">
            {post.excerpt}
          </p>
        </header>

        {/* Article Body */}
        <div className="py-12">
          <div
            className="prose prose-invert prose-zinc max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-img:rounded-lg prose-pre:border prose-pre:border-zinc-800 prose-table:border prose-table:border-zinc-800"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </div>

        {/* Share Buttons */}
        <ShareButtons
          title={post.title}
          url={currentUrl}
          copyLabel={t("copyLink")}
          copiedLabel={t("linkCopied")}
          shareLabel={t("share")}
        />

        {/* Related Posts */}
        <RelatedPosts
          posts={related}
          locale={locale}
          title={t("related")}
          readingTimeFormat={(m) => t("readingTime", { minutes: m })}
        />
      </article>
    </div>
  );
}
