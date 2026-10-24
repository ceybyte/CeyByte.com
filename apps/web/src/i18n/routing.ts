// next-intl routing config. Consumed by [locale]/layout, request.ts and all nav helpers.
// Static export: no middleware — locale detection is done by the Worker at GET / (03-TRD §3).
import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "si", "ta"] as const,
  defaultLocale: "en",
  // Locale prefix is always present in the URL: /en/, /si/, /ta/
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

// Locale-aware navigation primitives used throughout the app.
// Import from this file, not from next/navigation.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
