// Static sitemap generated at build time covering all known routes × 3 locales.
// Dynamic routes (ticket IDs, article slugs) are added here in Phase 4 and 8.
export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ceybyte.com";

const STATIC_PATHS = [
  "/",
  "/map/",
  "/docs/",
  "/docs/shortcuts/print/",
  "/releases/",
  "/feedback/",
  "/feedback/new/",
  "/donate/",
  "/blog/",
  "/login/",
  "/legal/terms/",
  "/legal/privacy/",
  "/legal/tax-disclaimer/",
  "/legal/data-safety/",
  "/legal/cookies/",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    const alternates: Record<string, string> = {};
    for (const locale of routing.locales) {
      alternates[locale] = `${SITE_URL}/${locale}${path}`;
    }

    entries.push({
      url: `${SITE_URL}/en${path}`,
      lastModified: new Date(),
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1.0 : 0.7,
      alternates: {
        languages: alternates,
      },
    });
  }

  return entries;
}
