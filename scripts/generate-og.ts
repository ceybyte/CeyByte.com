/// <reference types="bun-types" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

export interface OgCardOptions {
  title: string;
  category?: string;
  summary?: string;
  locale?: string;
  type?: "doc" | "blog" | "page";
}

let cachedFonts: {
  inter: Buffer;
  sinhala: Buffer;
  tamil: Buffer;
} | null = null;

function loadFonts() {
  if (cachedFonts) return cachedFonts;

  const root = resolve(__dirname, "..");
  const interPath = join(root, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");
  const sinhalaPath = join(
    root,
    "node_modules/@fontsource-variable/noto-sans-sinhala/files/noto-sans-sinhala-sinhala-wght-normal.woff2",
  );
  const tamilPath = join(
    root,
    "node_modules/@fontsource-variable/noto-sans-tamil/files/noto-sans-tamil-tamil-wght-normal.woff2",
  );

  cachedFonts = {
    inter: readFileSync(interPath),
    sinhala: readFileSync(sinhalaPath),
    tamil: readFileSync(tamilPath),
  };

  return cachedFonts;
}

export async function renderOgCard(options: OgCardOptions): Promise<Buffer> {
  const fonts = loadFonts();

  const {
    title,
    category = "Documentation",
    summary = "Free, offline-first Point-of-Sale for retail merchants in Sri Lanka.",
    locale = "en",
    type = "doc",
  } = options;

  const fontFamily =
    locale === "si"
      ? "Noto Sans Sinhala, Inter, sans-serif"
      : locale === "ta"
        ? "Noto Sans Tamil, Inter, sans-serif"
        : "Inter, sans-serif";

  const localeBadge = locale === "si" ? "සිංහල" : locale === "ta" ? "தமிழ்" : "English";

  const typeLabel = type === "blog" ? "BLOG POST" : type === "page" ? "CEYBYTE POS" : "DOCUMENTATION";

  const element = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "1200px",
        height: "630px",
        backgroundColor: "#07090e",
        backgroundImage:
          "radial-gradient(circle at 95% 10%, rgba(16, 185, 129, 0.18) 0%, rgba(7, 9, 14, 0) 50%), radial-gradient(circle at 10% 90%, rgba(5, 150, 105, 0.12) 0%, rgba(7, 9, 14, 0) 45%)",
        padding: "60px 70px",
        fontFamily,
        boxSizing: "border-box",
        border: "1px solid #1e293b",
      },
      children: [
        // Header
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            },
            children: [
              // Brand logo + text
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#ffffff",
                          fontSize: "20px",
                          fontWeight: 700,
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                        },
                        children: "CB",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "26px",
                          fontWeight: 700,
                          color: "#f8fafc",
                          letterSpacing: "-0.5px",
                        },
                        children: "CeyByte POS",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          color: "#34d399",
                          fontSize: "13px",
                          fontWeight: 600,
                        },
                        children: "100% Free · Offline",
                      },
                    },
                  ],
                },
              },
              // Section pill
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#131823",
                    border: "1px solid #1e293b",
                    color: "#94a3b8",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          color: "#10b981",
                        },
                        children: "●",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        children: `${typeLabel} · ${category.toUpperCase()}`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // Middle: Title & Summary
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginTop: "20px",
              marginBottom: "20px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: title.length > 50 ? "46px" : "56px",
                    fontWeight: 800,
                    color: "#ffffff",
                    lineHeight: 1.15,
                    letterSpacing: "-1px",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "22px",
                    color: "#94a3b8",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maxWidth: "960px",
                  },
                  children: summary,
                },
              },
            ],
          },
        },

        // Footer
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "24px",
              borderTop: "1px solid #1e293b",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#64748b",
                    fontSize: "16px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { color: "#34d399", fontWeight: 600 },
                        children: "ceybyte.com/cbpos",
                      },
                    },
                    { type: "span", props: { children: "—" } },
                    {
                      type: "span",
                      props: {
                        children: "No Monthly Fees · VAT & SSCL · Sinhala, Tamil & English",
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#131823",
                    border: "1px solid #273549",
                    color: "#cbd5e1",
                    fontSize: "14px",
                    fontWeight: 500,
                  },
                  children: localeBadge,
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(element as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Inter",
        data: fonts.inter,
        weight: 400,
        style: "normal",
      },
      {
        name: "Noto Sans Sinhala",
        data: fonts.sinhala,
        weight: 400,
        style: "normal",
      },
      {
        name: "Noto Sans Tamil",
        data: fonts.tamil,
        weight: 400,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });

  return resvg.render().asPng();
}

export async function generateAllOgImages(options?: { contentDir?: string; outputDir?: string }) {
  const contentDir = options?.contentDir ?? resolve(__dirname, "../apps/web/.content");
  const publicDir = options?.outputDir ?? resolve(__dirname, "../apps/web/public");

  const ogDir = join(publicDir, "og");
  if (!existsSync(ogDir)) {
    mkdirSync(ogDir, { recursive: true });
  }

  let count = 0;

  // 1. Default fallback image: apps/web/public/og-default.png
  const defaultPng = await renderOgCard({
    title: "CB POS — Free Retail Point-of-Sale for Sri Lanka",
    category: "Retail Software",
    summary:
      "Modern offline-first POS for groceries, bakeries, cafes, pharmacies, and hardware stores. No monthly fees, trilingual receipts, and automatic VAT/SSCL calculation.",
    locale: "en",
    type: "page",
  });
  writeFileSync(join(publicDir, "og-default.png"), defaultPng);
  count++;
  console.log("✓ Generated apps/web/public/og-default.png");

  // 2. Docs articles
  const docsPath = join(contentDir, "docs.json");
  if (existsSync(docsPath)) {
    const docs = JSON.parse(readFileSync(docsPath, "utf-8"));
    for (const doc of docs) {
      if (doc.slug && doc.locale) {
        const docDir = join(ogDir, doc.locale);
        if (!existsSync(docDir)) {
          mkdirSync(docDir, { recursive: true });
        }

        const png = await renderOgCard({
          title: doc.title || doc.slug,
          category: doc.category_slug || "Documentation",
          summary: doc.summary || "Complete user guide for CB POS.",
          locale: doc.locale,
          type: "doc",
        });

        const targetFile = join(docDir, `${doc.slug}.png`);
        writeFileSync(targetFile, png);
        count++;
      }
    }
    console.log(`✓ Generated OG images for ${docs.length} docs`);
  }

  // 3. Blog posts
  const blogPath = join(contentDir, "blog.json");
  if (existsSync(blogPath)) {
    const posts = JSON.parse(readFileSync(blogPath, "utf-8"));
    for (const post of posts) {
      if (post.slug && post.locale) {
        const postDir = join(ogDir, post.locale);
        if (!existsSync(postDir)) {
          mkdirSync(postDir, { recursive: true });
        }

        const png = await renderOgCard({
          title: post.title || post.slug,
          category: "Blog",
          summary: post.excerpt || "Updates and guides from CB POS.",
          locale: post.locale,
          type: "blog",
        });

        const targetFile = join(postDir, `${post.slug}.png`);
        writeFileSync(targetFile, png);
        count++;
      }
    }
    console.log(`✓ Generated OG images for ${posts.length} blog posts`);
  }

  console.log(`✓ Finished generating total of ${count} OG images`);
  return count;
}

if (import.meta.main) {
  generateAllOgImages().catch((err) => {
    console.error("Failed to generate OG images:", err);
    process.exit(1);
  });
}
