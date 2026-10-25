import rawCategories from "../../../.content/categories.json";
import rawDocs from "../../../.content/docs.json";

export interface DocCategory {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon: string;
  sortOrder: number;
}

export interface DocArticle {
  id: string;
  translationKey: string;
  locale: string;
  categorySlug: string;
  slug: string;
  title: string;
  summary: string;
  bodyMd: string;
  status: "published" | "draft";
  sortOrder: number;
  publishedAt?: number | null;
  appVersionMin?: string;
  isFallback?: boolean;
}

export interface DocNavItem {
  title: string;
  slug: string;
  categorySlug: string;
  isFallback?: boolean;
}

export interface DocNavigation {
  prev?: DocNavItem;
  next?: DocNavItem;
}

interface RawCategory {
  id: string;
  slug: string;
  title_en: string;
  title_si?: string;
  title_ta?: string;
  description_en?: string;
  description_si?: string;
  description_ta?: string;
  icon: string;
  sort_order: number;
}

interface RawDoc {
  id: string;
  translation_key: string;
  locale: string;
  category_id?: string;
  category_slug: string;
  slug: string;
  title: string;
  summary?: string;
  body_md: string;
  status: "published" | "draft";
  sort_order: number;
  published_at?: number | null;
  app_version_min?: string;
}

const categoriesData = rawCategories as unknown as RawCategory[];
const docsData = rawDocs as unknown as RawDoc[];

export function getCategories(locale: string = "en"): DocCategory[] {
  return [...categoriesData]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => {
      let title = c.title_en;
      if (locale === "si" && c.title_si) title = c.title_si;
      if (locale === "ta" && c.title_ta) title = c.title_ta;

      let description = c.description_en;
      if (locale === "si" && c.description_si) description = c.description_si;
      if (locale === "ta" && c.description_ta) description = c.description_ta;

      return {
        id: c.id,
        slug: c.slug,
        title,
        description,
        icon: c.icon,
        sortOrder: c.sort_order,
      };
    });
}

export function getCategoryBySlug(slug: string, locale: string = "en"): DocCategory | undefined {
  const cat = categoriesData.find((c) => c.slug === slug);
  if (!cat) return undefined;

  let title = cat.title_en;
  if (locale === "si" && cat.title_si) title = cat.title_si;
  if (locale === "ta" && cat.title_ta) title = cat.title_ta;

  let description = cat.description_en;
  if (locale === "si" && cat.description_si) description = cat.description_si;
  if (locale === "ta" && cat.description_ta) description = cat.description_ta;

  return {
    id: cat.id,
    slug: cat.slug,
    title,
    description,
    icon: cat.icon,
    sortOrder: cat.sort_order,
  };
}

function normalizeDoc(d: RawDoc, isFallback = false): DocArticle {
  return {
    id: d.id,
    translationKey: d.translation_key,
    locale: d.locale,
    categorySlug: d.category_slug,
    slug: d.slug,
    title: d.title,
    summary: d.summary || "",
    bodyMd: d.body_md,
    status: d.status,
    sortOrder: d.sort_order,
    publishedAt: d.published_at,
    appVersionMin: d.app_version_min,
    isFallback,
  };
}

export function getArticles(locale: string = "en"): DocArticle[] {
  // Collect all distinct slugs
  const allEnglishDocs = docsData
    .filter((d) => d.locale === "en")
    .sort((a, b) => a.sort_order - b.sort_order);

  if (locale === "en") {
    return allEnglishDocs.map((d) => normalizeDoc(d, false));
  }

  return allEnglishDocs.map((enDoc) => {
    const localized = docsData.find(
      (d) => d.slug === enDoc.slug && d.category_slug === enDoc.category_slug && d.locale === locale,
    );
    if (localized) {
      return normalizeDoc(localized, false);
    }
    return normalizeDoc(enDoc, true);
  });
}

export function getArticlesByCategory(categorySlug: string, locale: string = "en"): DocArticle[] {
  return getArticles(locale).filter((a) => a.categorySlug === categorySlug);
}

export function getArticle(
  categorySlug: string,
  slug: string,
  locale: string = "en",
): DocArticle | undefined {
  const directMatch = docsData.find(
    (d) => d.category_slug === categorySlug && d.slug === slug && d.locale === locale,
  );
  if (directMatch) {
    return normalizeDoc(directMatch, false);
  }

  if (locale !== "en") {
    const enFallback = docsData.find(
      (d) => d.category_slug === categorySlug && d.slug === slug && d.locale === "en",
    );
    if (enFallback) {
      return normalizeDoc(enFallback, true);
    }
  }

  return undefined;
}

export function getDocsNavigation(
  categorySlug: string,
  slug: string,
  locale: string = "en",
): DocNavigation {
  const allArticles = getArticles(locale);
  const currentIndex = allArticles.findIndex(
    (a) => a.categorySlug === categorySlug && a.slug === slug,
  );

  if (currentIndex === -1) return {};

  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : undefined;
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : undefined;

  return {
    prev: prevArticle
      ? {
          title: prevArticle.title,
          slug: prevArticle.slug,
          categorySlug: prevArticle.categorySlug,
          isFallback: prevArticle.isFallback,
        }
      : undefined,
    next: nextArticle
      ? {
          title: nextArticle.title,
          slug: nextArticle.slug,
          categorySlug: nextArticle.categorySlug,
          isFallback: nextArticle.isFallback,
        }
      : undefined,
  };
}

export function isTaxArticle(article: DocArticle): boolean {
  return article.categorySlug === "tax";
}
