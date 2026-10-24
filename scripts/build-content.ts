/// <reference types="bun-types" />
// scripts/build-content.ts
// Extracts categories, docs articles, blog posts, and releases from D1 (or fallback fixtures).
// Emits static json into apps/web/.content/{categories,docs,blog,releases}.json for the build pipeline (02-TRD §6).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, "..");
const CONTENT_DIR = resolve(ROOT_DIR, "apps/web/.content");
const FIXTURES_FILE = resolve(CONTENT_DIR, "fixtures.json");

if (!existsSync(CONTENT_DIR)) {
  mkdirSync(CONTENT_DIR, { recursive: true });
}

const args = new Set(process.argv.slice(2));
const target = args.has("--remote") ? "production" : args.has("--preview") ? "preview" : "local";
const db = target === "preview" ? "cbpos-db-preview" : "cbpos-db";
const flags = { local: ["--local"], preview: ["--remote", "--env", "preview"], production: ["--remote"] }[target];

interface D1Result<T> {
  results?: T[];
  success?: boolean;
}

interface RawD1Output<T> {
  results?: T[];
  [key: string]: unknown;
}

async function queryD1<T>(query: string): Promise<T[] | null> {
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
    if (code !== 0) return null;

    const parsed = JSON.parse(stdout);
    if (Array.isArray(parsed) && parsed[0]?.results) {
      return parsed[0].results as T[];
    }
    return null;
  } catch {
    return null;
  }
}

async function run() {
  console.log(`[build-content] Extracting content for target: ${target}`);

  let fallbackData: any = null;
  if (existsSync(FIXTURES_FILE)) {
    try {
      fallbackData = JSON.parse(readFileSync(FIXTURES_FILE, "utf-8"));
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
  const rawDocs = await queryD1(docsQuery);
  const docs: unknown[] = rawDocs && rawDocs.length > 0 ? rawDocs : (fallbackData?.docs ?? []);

  // 3. Blog Posts
  const blogStatusFilter =
    target === "production" ? "WHERE status = 'published'" : "WHERE status IN ('published', 'draft')";
  const blogQuery = `SELECT id, translation_key, locale, slug, title, excerpt, body_md, tags, status, reading_minutes, published_at FROM blog_posts ${blogStatusFilter} ORDER BY published_at DESC;`;
  const rawBlog = await queryD1(blogQuery);
  const blog: unknown[] = rawBlog && rawBlog.length > 0 ? rawBlog : (fallbackData?.blog ?? []);

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
