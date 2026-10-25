"use client";

import Link from "next/link";
import { LEGAL_SLUGS } from "../content";
import type { LegalSlug } from "../types";

interface LegalNavProps {
  locale: string;
  activeSlug: LegalSlug;
}

const NAV_ITEMS: Record<LegalSlug, string> = {
  terms: "Terms of Service",
  eula: "EULA",
  privacy: "Privacy Policy",
  "tax-disclaimer": "Tax Disclaimer",
  "data-safety": "Data Safety",
  cookies: "Cookies Policy",
};

export function LegalNav({ locale, activeSlug }: LegalNavProps) {
  return (
    <nav
      aria-label="Legal Center Navigation"
      className="flex flex-row gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0"
    >
      {LEGAL_SLUGS.map((slug) => {
        const isActive = activeSlug === slug;
        return (
          <Link
            key={slug}
            href={`/${locale}/legal/${slug}`}
            className={`rounded-sm border-l-2 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              isActive
                ? "border-azure text-azure bg-surface-card font-medium"
                : "text-text-muted hover:text-text hover:bg-surface-hover border-transparent"
            }`}
          >
            {NAV_ITEMS[slug]}
          </Link>
        );
      })}
    </nav>
  );
}
