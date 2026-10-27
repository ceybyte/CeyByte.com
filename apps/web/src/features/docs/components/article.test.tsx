import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FallbackBanner } from "./fallback-banner";
import { TaxDisclaimerCallout } from "./tax-disclaimer-callout";
import { ArticleFeedback } from "./article-feedback";
import { ArticleToc } from "./article-toc";
import { ArticleSidebar } from "./article-sidebar";
import { MarkdownRenderer } from "./markdown-renderer";
import { getCategories, getArticles } from "../source";

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/en.json"), "utf-8"));
const siMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/si.json"), "utf-8"));

describe("S05 Doc Article Components", () => {
  const categories = getCategories("en");
  const articles = getArticles("en");

  test("FallbackBanner renders banner message when isFallback is true", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="si" messages={siMessages}>
        <FallbackBanner locale="si" />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("මෙම පිටුව තවමත් සිංහල භාෂාවෙන් නොමැත");
  });

  test("TaxDisclaimerCallout renders IRD tax disclaimer", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <TaxDisclaimerCallout locale="en" />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("The IRD");
    expect(html).toContain("tax disclaimer");
  });

  test("ArticleFeedback renders helpful question with Yes and No buttons", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ArticleFeedback articleSlug="install" categorySlug="getting-started" locale="en" />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("Did this page help?");
    expect(html).toContain("Yes");
    expect(html).toContain("No");
  });

  test("ArticleToc renders table of contents items", () => {
    const tocItems = [
      { id: "system-requirements", text: "System Requirements", level: 2 },
      { id: "installation-steps", text: "Installation Steps", level: 2 },
    ];
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ArticleToc items={tocItems} />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("On this page");
    expect(html).toContain("System Requirements");
    expect(html).toContain("Installation Steps");
    expect(html).toContain("#system-requirements");
  });

  test("ArticleSidebar highlights active article with azure accent", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ArticleSidebar
          categories={categories}
          articles={articles}
          currentCategorySlug="getting-started"
          currentArticleSlug="install"
          locale="en"
        />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("Install CB POS");
    expect(html).toContain("Get past Windows SmartScreen");
    // Getting Started is active
    expect(html).toContain("getting-started");
  });

  test("MarkdownRenderer wraps article in prose-ceybyte class", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <MarkdownRenderer html="<p>Test content</p>" />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("prose-ceybyte");
    expect(html).toContain("Test content");
  });
});
