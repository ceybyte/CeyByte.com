import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HubStartHere } from "./hub-start-here";
import { HubCategories } from "./hub-categories";
import { DocsSearchTrigger } from "./docs-search-trigger";
import { getCategories, getArticles } from "../source";

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/en.json"), "utf-8"));

describe("S04 Documentation Hub Components", () => {
  const categories = getCategories("en");
  const articles = getArticles("en");

  test("DocsSearchTrigger renders search field-button with ⌘K hint", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocsSearchTrigger />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("Search the help pages");
    expect(html).toContain("⌘K");
  });

  test("HubStartHere renders 4 compact starter cards", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <HubStartHere locale="en" />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("Install CB POS");
    expect(html).toContain("Get past Windows SmartScreen");
    expect(html).toContain("First login and default PIN");
    expect(html).toContain("Connect a receipt printer");
    expect(html).toContain("/en/docs/getting-started/install");
    expect(html).toContain("/en/docs/getting-started/smartscreen");
  });

  test("HubCategories renders 10 categories with mono counts and Tax disclaimer tag", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <HubCategories categories={categories} articles={articles} locale="en" />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("Getting started");
    expect(html).toContain("Cashiering");
    expect(html).toContain("Tax");
    expect(html).toContain("Hardware");
    expect(html).toContain("Release notes");
    // Disclaimer tag on Tax card
    expect(html).toContain("Disclaimer");
    // Crosshair corner decorations
    expect(html).toContain("+");
  });
});
