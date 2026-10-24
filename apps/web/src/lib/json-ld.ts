// JSON-LD schema generators used by individual pages.
// All types match Schema.org; kept minimal — only fields we can accurately populate.
import React from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ceybyte.com";

export function websiteSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CB POS",
    url: `${SITE_URL}/${locale}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/${locale}/docs?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  } as const;
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ceylon Byte",
    url: SITE_URL,
    foundingLocation: { "@type": "Place", name: "Sri Lanka" },
  } as const;
}

/** FAQPage schema. items: array of { q, a } plain text. */
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  } as const;
}

/** SoftwareApplication schema for the homepage / product pages. */
export function softwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CB POS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows 10 or later",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "LKR",
    },
    description:
      "Free offline-first point-of-sale software for Sri Lankan retail shops. Calculates VAT and SSCL, prints Sinhala, Tamil and English receipts.",
    inLanguage: ["en", "si", "ta"],
    creator: { "@type": "Organization", name: "Ceylon Byte" },
  } as const;
}

/** Injects a JSON-LD script tag. Call in page.tsx head or layout.tsx. */
export function JsonLd({ schema }: { schema: object }) {
  return React.createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
  });
}
