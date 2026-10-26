import type { TocItem } from "@cbpos/shared";

export type BlogLocale = "en" | "si" | "ta";

export type BlogPost = {
  id: string;
  translationKey: string;
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  html: string;
  bodyHast?: string | null;
  toc?: TocItem[];
  coverImageKey?: string | null;
  coverAlt?: string | null;
  ogImageKey?: string | null;
  tags: string[];
  status: "draft" | "scheduled" | "published" | "archived";
  readingMinutes: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | number | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
  isFallback?: boolean;
};

export type TagItem = {
  key: string;
  label: string;
};
