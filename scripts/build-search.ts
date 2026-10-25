/// <reference types="bun-types" />
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { create, insert } from "@orama/orama";
import { persist } from "@orama/plugin-data-persistence";
import { extractPlainText } from "../packages/shared/src/markdown/plain-text";

export const LOCALES = ["en", "si", "ta"] as const;
export type SupportedLocale = (typeof LOCALES)[number];

export const searchSchema = {
  id: "string",
  slug: "string",
  locale: "string",
  title: "string",
  description: "string",
  category: "string",
  content: "string",
  type: "string",
} as const;

export function createUnicodeTokenizer(language: string) {
  return {
    language,
    normalizationCache: new Map<string, string>(),
    tokenize(raw: string) {
      if (!raw) return [];
      return raw
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'\n\r\t]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 0);
    },
  };
}

export type SearchDoc = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  description: string;
  category: string;
  content: string;
  type: "doc" | "blog";
};

type RawDocItem = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  summary?: string;
  category_slug?: string;
  body_md: string;
};

type RawBlogItem = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  excerpt?: string;
  body_md: string;
};

export async function buildSearchIndices(options?: { contentDir?: string; outputDir?: string }) {
  const contentDir = options?.contentDir ?? resolve(__dirname, "../apps/web/.content");
  const outputDir = options?.outputDir ?? resolve(__dirname, "../apps/web/public/search");

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Load docs
  const docsPath = join(contentDir, "docs.json");
  const blogPath = join(contentDir, "blog.json");

  let rawDocs: RawDocItem[] = [];
  let rawBlog: RawBlogItem[] = [];

  if (existsSync(docsPath)) {
    rawDocs = JSON.parse(readFileSync(docsPath, "utf-8"));
  }
  if (existsSync(blogPath)) {
    rawBlog = JSON.parse(readFileSync(blogPath, "utf-8"));
  }

  const manifest: {
    builtAt: string;
    indices: Record<
      string,
      {
        documents: number;
        sizeBytes: number;
      }
    >;
  } = {
    builtAt: new Date().toISOString(),
    indices: {},
  };

  for (const locale of LOCALES) {
    const db = await create({
      schema: searchSchema,
      components: {
        tokenizer: createUnicodeTokenizer(locale),
      },
    });

    const localeDocs: SearchDoc[] = [];

    // Process documentation articles
    for (const doc of rawDocs) {
      if (doc.locale === locale) {
        localeDocs.push({
          id: `doc:${doc.slug}:${doc.locale}`,
          slug: doc.slug,
          locale: doc.locale,
          title: doc.title || "",
          description: doc.summary || "",
          category: doc.category_slug || "",
          content: extractPlainText(doc.body_md || ""),
          type: "doc",
        });
      }
    }

    // Process blog posts
    for (const post of rawBlog) {
      if (post.locale === locale) {
        localeDocs.push({
          id: `blog:${post.slug}:${post.locale}`,
          slug: post.slug,
          locale: post.locale,
          title: post.title || "",
          description: post.excerpt || "",
          category: "blog",
          content: extractPlainText(post.body_md || ""),
          type: "blog",
        });
      }
    }

    // Insert all documents
    for (const item of localeDocs) {
      await insert(db, item);
    }

    // Persist as JSON string
    const jsonOutput = await persist(db, "json");
    const targetFile = join(outputDir, `${locale}.json`);
    writeFileSync(
      targetFile,
      typeof jsonOutput === "string" ? jsonOutput : Buffer.from(jsonOutput as ArrayBuffer),
      "utf-8",
    );

    const stat = statSync(targetFile);
    manifest.indices[locale] = {
      documents: localeDocs.length,
      sizeBytes: stat.size,
    };

    console.log(
      `✓ Search index [${locale}]: ${localeDocs.length} items, ${(stat.size / 1024).toFixed(1)} KB`,
    );
  }

  // Write manifest.json
  const manifestFile = join(outputDir, "manifest.json");
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`✓ Generated ${manifestFile}`);

  return manifest;
}

if (import.meta.main) {
  buildSearchIndices().catch((err) => {
    console.error("Failed to build search indices:", err);
    process.exit(1);
  });
}
