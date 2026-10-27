/// <reference types="bun-types" />
// scripts/build-content.ts
// Extracts categories, docs articles, blog posts, and releases from D1 (or fallback fixtures).
// Emits static json into apps/web/.content/{categories,docs,blog,releases}.json for the build pipeline (02-TRD §6).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  processMarkdown,
  calculateReadingTime,
  extractPlainText,
} from "../packages/shared/src/markdown/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, "..");
const CONTENT_DIR = resolve(ROOT_DIR, "apps/web/.content");
const FIXTURES_FILE = resolve(CONTENT_DIR, "fixtures.json");

if (!existsSync(CONTENT_DIR)) {
  mkdirSync(CONTENT_DIR, { recursive: true });
}

const args = new Set(process.argv.slice(2));

if (args.has("--if-missing")) {
  const reqFiles = ["categories.json", "docs.json", "blog.json", "releases.json"];
  if (reqFiles.every((f) => existsSync(resolve(CONTENT_DIR, f)))) {
    process.exit(0);
  }
}

const target = args.has("--remote") ? "production" : args.has("--preview") ? "preview" : "local";
const db = target === "preview" ? "cbpos-db-preview" : "cbpos-db";
const flags = { local: ["--local"], preview: ["--remote", "--env", "preview"], production: ["--remote"] }[
  target
];

type FallbackData = {
  categories?: unknown[];
  docs?: Array<Record<string, unknown> & { locale?: string }>;
  blog?: Array<Record<string, unknown> & { locale?: string }>;
  releases?: unknown[];
};

let d1Failed = false;

async function queryD1<T>(query: string): Promise<T[] | null> {
  if (d1Failed) return null;
  try {
    const proc = Bun.spawn(
      ["bunx", "wrangler", "d1", "execute", db, ...flags, "--command", query, "--json"],
      {
        cwd: resolve(ROOT_DIR, "apps/api"),
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const stdout = await new Response(proc.stdout).text();
    const code = await proc.exited;
    if (code !== 0) {
      d1Failed = true;
      return null;
    }

    const parsed = JSON.parse(stdout);
    if (Array.isArray(parsed) && parsed[0]?.results) {
      return parsed[0].results as T[];
    }
    d1Failed = true;
    return null;
  } catch {
    d1Failed = true;
    return null;
  }
}

async function run() {
  console.log(`[build-content] Extracting content for target: ${target}`);

  let fallbackData: FallbackData | null = null;
  if (existsSync(FIXTURES_FILE)) {
    try {
      fallbackData = JSON.parse(readFileSync(FIXTURES_FILE, "utf-8")) as FallbackData;
    } catch {
      // ignore fixture read failure
    }
  }

  // 1. Categories
  const categoriesQuery =
    "SELECT id, slug, parent_id, title_en, title_si, title_ta, description_en, description_si, description_ta, icon, sort_order FROM docs_categories ORDER BY sort_order ASC;";
  const rawCategories = await queryD1(categoriesQuery);
  const categories: unknown[] =
    rawCategories && rawCategories.length > 0 ? rawCategories : (fallbackData?.categories ?? []);

  // 2. Docs Articles (published or non-prod drafts)
  const statusFilter =
    target === "production" ? "WHERE status = 'published'" : "WHERE status IN ('published', 'draft')";
  const docsQuery = `SELECT a.id, a.translation_key, a.locale, a.category_id, c.slug as category_slug, a.slug, a.title, a.summary, a.body_md, a.status, a.sort_order, a.published_at FROM docs_articles a LEFT JOIN docs_categories c ON a.category_id = c.id ${statusFilter} ORDER BY a.sort_order ASC;`;
  const rawDocs = await queryD1<Record<string, unknown> & { locale?: string }>(docsQuery);
  const docs: Array<Record<string, unknown> & { locale?: string }> =
    rawDocs && rawDocs.length > 0 ? [...rawDocs] : (fallbackData?.docs ?? []);
  if (fallbackData?.docs) {
    const presentLocales = new Set(docs.map((d) => d.locale));
    for (const loc of ["en", "si", "ta"]) {
      if (!presentLocales.has(loc)) {
        const missing = fallbackData.docs.filter((d) => d.locale === loc);
        docs.push(...missing);
      }
    }
  }

  // 3. Blog Posts (Strict schedule enforcement: future scheduled posts must never be included in production)
  const nowMs = Date.now();
  const blogStatusFilter =
    target === "production"
      ? "WHERE (status = 'published' AND (published_at IS NULL OR published_at <= " +
        nowMs +
        ")) OR (status = 'scheduled' AND published_at <= " +
        nowMs +
        ")"
      : "WHERE status IN ('published', 'draft', 'scheduled')";
  const blogQuery = `SELECT id, translation_key, locale, slug, title, excerpt, body_md, body_hast, toc_json, cover_image_key, cover_alt, og_image_key, tags, status, reading_minutes, seo_title, seo_description, published_at, created_at, updated_at FROM blog_posts ${blogStatusFilter} ORDER BY published_at DESC;`;
  const rawBlog = await queryD1<Record<string, unknown> & { locale?: string }>(blogQuery);
  const blogPool: Array<Record<string, unknown> & { locale?: string }> =
    rawBlog && rawBlog.length > 0 ? [...rawBlog] : (fallbackData?.blog ?? []);
  if (fallbackData?.blog) {
    const presentLocales = new Set(blogPool.map((b) => b.locale));
    for (const loc of ["en", "si", "ta"]) {
      if (!presentLocales.has(loc)) {
        const missing = fallbackData.blog.filter((b) => b.locale === loc);
        blogPool.push(...missing);
      }
    }
  }

  // Filter out any future scheduled posts if using fixtures in production
  const filteredBlog =
    target === "production"
      ? blogPool.filter((p) => {
          if (p.status === "scheduled" || p.status === "published") {
            if (p.published_at && typeof p.published_at === "number" && p.published_at > nowMs) {
              return false;
            }
          }
          return p.status === "published" || p.status === "scheduled";
        })
      : blogPool;

  // Process markdown AST and TOC for each blog post
  const blog = [];
  for (const raw of filteredBlog) {
    const bodyMd = String(raw.body_md || raw.bodyMd || "");
    const locale = String(raw.locale || "en");
    const proc = await processMarkdown(bodyMd, { locale });
    const plain = extractPlainText(bodyMd);
    const readingMinutes = Number(raw.reading_minutes || raw.readingMinutes) || calculateReadingTime(plain);

    let tags: string[] = [];
    if (Array.isArray(raw.tags)) {
      tags = raw.tags as string[];
    } else if (typeof raw.tags === "string") {
      try {
        const parsedTags = JSON.parse(raw.tags);
        tags = Array.isArray(parsedTags) ? parsedTags : [raw.tags];
      } catch {
        tags = raw.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    blog.push({
      id: raw.id,
      translationKey: raw.translation_key || raw.translationKey,
      translation_key: raw.translation_key || raw.translationKey,
      locale,
      slug: raw.slug,
      title: raw.title,
      excerpt: raw.excerpt,
      bodyMd,
      body_md: bodyMd,
      html: proc.html,
      bodyHast: proc.html,
      body_hast: proc.html,
      toc: proc.toc,
      tocJson: proc.toc,
      toc_json: proc.toc,
      coverImageKey: raw.cover_image_key || raw.coverImageKey || null,
      cover_image_key: raw.cover_image_key || raw.coverImageKey || null,
      coverAlt: raw.cover_alt || raw.coverAlt || null,
      cover_alt: raw.cover_alt || raw.coverAlt || null,
      ogImageKey: raw.og_image_key || raw.ogImageKey || null,
      og_image_key: raw.og_image_key || raw.ogImageKey || null,
      tags,
      status: raw.status || "published",
      readingMinutes,
      reading_minutes: readingMinutes,
      seoTitle: raw.seo_title || raw.seoTitle || null,
      seoDescription: raw.seo_description || raw.seoDescription || null,
      publishedAt: raw.published_at || raw.publishedAt || null,
      published_at: raw.published_at || raw.publishedAt || null,
      createdAt: raw.created_at || raw.createdAt || null,
      updatedAt: raw.updated_at || raw.updatedAt || null,
    });
  }

  // 4. Releases
  const releasesQuery =
    "SELECT id, version, channel, release_date, exe_url as download_url, notes_md as changelog, min_os as min_version, exe_sha256 as sha256, is_latest, is_yanked, published_at FROM releases WHERE is_yanked = 0 ORDER BY published_at DESC;";
  const rawReleases = await queryD1(releasesQuery);
  const releases: unknown[] =
    rawReleases && rawReleases.length > 0 ? rawReleases : (fallbackData?.releases ?? []);

  // Write content files
  writeFileSync(resolve(CONTENT_DIR, "categories.json"), JSON.stringify(categories, null, 2) + "\n");
  writeFileSync(resolve(CONTENT_DIR, "docs.json"), JSON.stringify(docs, null, 2) + "\n");
  writeFileSync(resolve(CONTENT_DIR, "blog.json"), JSON.stringify(blog, null, 2) + "\n");
  writeFileSync(resolve(CONTENT_DIR, "releases.json"), JSON.stringify(releases, null, 2) + "\n");

  console.log(`[build-content] Emitted:
  - categories.json (${categories.length} entries)
  - docs.json (${docs.length} entries)
  - blog.json (${blog.length} entries)
  - releases.json (${releases.length} entries)`);
}

run().catch((err) => {
  console.error("[build-content] Error:", err);
  process.exit(1);
});
