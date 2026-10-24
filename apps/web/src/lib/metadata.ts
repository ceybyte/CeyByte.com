// buildMetadata — locale-aware metadata factory used by every page.
// Sets hreflang alternates, OpenGraph locale, and merges page-level overrides.
// Import and call in each page's generateMetadata().
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ceybyte.com";

const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  si: "si_LK",
  ta: "ta_LK",
};

export type PageMeta = {
  locale: string;
  /** Canonical path without the locale prefix, e.g. "/docs/getting-started/install". */
  path: string;
  title: string;
  description: string;
  /** Override default OG image (absolute URL). */
  ogImage?: string;
};

export function buildMetadata({ locale, path, title, description, ogImage }: PageMeta): Metadata {
  const canonical = `${SITE_URL}/${locale}${path}`;
  const alternates = Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`]));

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages: {
        ...alternates,
        "x-default": `${SITE_URL}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "CB POS",
      locale: OG_LOCALE[locale] ?? "en_US",
      type: "website",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
