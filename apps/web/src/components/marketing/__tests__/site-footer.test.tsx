import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => "/",
}));

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/en.json"), "utf-8"));

mock.module("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, string | number>) => {
    let result = key;
    if (namespace === "footer") {
      result = enMessages.footer[key] ?? key;
    } else if (namespace === "footer.links") {
      result = enMessages.footer.links[key] ?? key;
    } else {
      result = key;
    }
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        result = result.replace(`{${k}}`, String(v));
      }
    }
    return result;
  },
  useLocale: () => "en",
}));

import { SiteFooter } from "../site-footer";

describe("SiteFooter (Style 1: Ultra-Clean 2-Row Editorial)", () => {
  test("renders master logo, mission statement, navigation links, and engineered badge without theme/language switches or verbose tax legalLine", () => {
    const html = renderToString(<SiteFooter />);

    // Master branding (no CB POS product badge in footer)
    expect(html).toContain("CeyByte");
    expect(html).not.toContain("CB&nbsp;POS");

    // Mission statement
    expect(html).toContain("Open retail technology &amp; software engineered in Sri Lanka by Ceylon Byte.");

    // Navigation links
    expect(html).toContain('href="/features"');
    expect(html).toContain('href="/docs"');
    expect(html).toContain('href="/releases"');
    expect(html).toContain('href="/legal/terms"');
    expect(html).toContain('href="/legal/privacy"');

    // Engineered in Sri Lanka badge
    expect(html).toContain("ENGINEERED IN SRI LANKA");

    // Redundant toggles must be absent from footer
    expect(html).not.toContain("Choose language (footer)");
    expect(html).not.toContain("Switch to light theme");
    expect(html).not.toContain("Switch to dark theme");

    // Verbose IRD disclaimer paragraph must be absent from footer
    expect(html).not.toContain("comes as is, without a warranty");
  });
});
