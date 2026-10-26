import rawBlog from "../../../.content/blog.json";
import type { BlogPost } from "./types";

interface RawBlogPost {
  id: string;
  translationKey?: string;
  translation_key?: string;
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd?: string;
  body_md?: string;
  html?: string;
  bodyHast?: string;
  body_hast?: string;
  toc?: BlogPost["toc"];
  tocJson?: BlogPost["toc"];
  toc_json?: BlogPost["toc"];
  coverImageKey?: string | null;
  cover_image_key?: string | null;
  coverAlt?: string | null;
  cover_alt?: string | null;
  ogImageKey?: string | null;
  og_image_key?: string | null;
  tags?: string[] | string;
  status?: string;
  readingMinutes?: number;
  reading_minutes?: number;
  seoTitle?: string | null;
  seo_title?: string | null;
  seoDescription?: string | null;
  seo_description?: string | null;
  publishedAt?: string | number | null;
  published_at?: string | number | null;
  createdAt?: string | number | null;
  created_at?: string | number | null;
  updatedAt?: string | number | null;
  updated_at?: string | number | null;
}

const blogData = (rawBlog as unknown as RawBlogPost[]) || [];

function normalizePost(raw: RawBlogPost, isFallback = false): BlogPost {
  let tags: string[] = [];
  if (Array.isArray(raw.tags)) {
    tags = raw.tags;
  } else if (typeof raw.tags === "string") {
    try {
      const parsed = JSON.parse(raw.tags);
      tags = Array.isArray(parsed) ? parsed : [raw.tags];
    } catch {
      tags = raw.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }

  const html = raw.html || raw.bodyHast || raw.body_hast || "";
  const toc = raw.toc || raw.tocJson || raw.toc_json || [];

  return {
    id: raw.id,
    translationKey: raw.translationKey || raw.translation_key || raw.slug,
    locale: raw.locale,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt,
    bodyMd: raw.bodyMd || raw.body_md || "",
    html,
    bodyHast: html,
    toc,
    coverImageKey: raw.coverImageKey || raw.cover_image_key || null,
    coverAlt: raw.coverAlt || raw.cover_alt || null,
    ogImageKey: raw.ogImageKey || raw.og_image_key || null,
    tags,
    status: (raw.status as BlogPost["status"]) || "published",
    readingMinutes: Number(raw.readingMinutes || raw.reading_minutes) || 1,
    seoTitle: raw.seoTitle || raw.seo_title || null,
    seoDescription: raw.seoDescription || raw.seo_description || null,
    publishedAt: raw.publishedAt || raw.published_at || null,
    createdAt: raw.createdAt || raw.created_at || null,
    updatedAt: raw.updatedAt || raw.updated_at || null,
    isFallback,
  };
}

export function getBlogPosts(locale: string = "en"): BlogPost[] {
  const published = blogData.filter((p) => p.status === "published" || !p.status);

  // If English, return all English posts sorted by published date
  if (locale === "en") {
    return published
      .filter((p) => p.locale === "en")
      .map((p) => normalizePost(p, false))
      .sort((a, b) => {
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return db - da;
      });
  }

  // If Sinhala or Tamil, return posts created in that locale
  const localized = published.filter((p) => p.locale === locale).map((p) => normalizePost(p, false));

  return localized.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });
}

export function getAlsoInEnglishPosts(locale: string): BlogPost[] {
  if (locale === "en") return [];

  const published = blogData.filter((p) => p.status === "published" || !p.status);
  const localizedKeys = new Set(
    published.filter((p) => p.locale === locale).map((p) => p.translationKey || p.translation_key || p.slug),
  );

  return published
    .filter((p) => p.locale === "en")
    .filter((p) => {
      const key = p.translationKey || p.translation_key || p.slug;
      return !localizedKeys.has(key);
    })
    .map((p) => normalizePost(p, true));
}

export function getBlogPostBySlug(slug: string, locale: string = "en"): BlogPost | undefined {
  const published = blogData.filter((p) => p.status === "published" || !p.status);

  // Direct locale match
  const direct = published.find((p) => p.slug === slug && p.locale === locale);
  if (direct) {
    return normalizePost(direct, false);
  }

  // English fallback for non-English locales
  if (locale !== "en") {
    const enFallback = published.find((p) => p.slug === slug && p.locale === "en");
    if (enFallback) {
      return normalizePost(enFallback, true);
    }
  }

  return undefined;
}

export function getAllBlogSlugs(): Array<{ slug: string; locale: string }> {
  return blogData.map((p) => ({
    slug: p.slug,
    locale: p.locale,
  }));
}

export function getRelatedPosts(
  currentSlug: string,
  tags: string[],
  locale: string = "en",
  limit = 2,
): BlogPost[] {
  const allPosts = getBlogPosts(locale);
  const tagSet = new Set(tags);

  return allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => tagSet.has(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}
