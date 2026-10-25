import { describe, expect, test } from "bun:test";
import {
  getCategories,
  getCategoryBySlug,
  getArticles,
  getArticlesByCategory,
  getArticle,
  getDocsNavigation,
  isTaxArticle,
} from "./source";

describe("Docs Source", () => {
  test("getCategories returns the 10 docs categories in sort order", () => {
    const cats = getCategories("en");
    expect(cats.length).toBe(10);
    expect(cats[0]!.slug).toBe("getting-started");
    expect(cats[1]!.slug).toBe("cashiering");
    expect(cats[3]!.slug).toBe("tax");
    expect(cats[cats.length - 1]!.slug).toBe("release-notes");
  });

  test("getCategoryBySlug resolves category by slug with localized title", () => {
    const catEn = getCategoryBySlug("tax", "en");
    expect(catEn).toBeDefined();
    expect(catEn?.title).toBe("Tax");

    const catSi = getCategoryBySlug("tax", "si");
    expect(catSi).toBeDefined();
    expect(catSi?.title).toBeDefined();
  });

  test("getArticles returns 11 seed articles in English", () => {
    const articles = getArticles("en");
    expect(articles.length).toBeGreaterThanOrEqual(11);

    const slugs = articles.map((a) => a.slug);
    expect(slugs).toContain("install");
    expect(slugs).toContain("smartscreen");
    expect(slugs).toContain("first-login");
    expect(slugs).toContain("first-sale");
    expect(slugs).toContain("keyboard-shortcuts");
    expect(slugs).toContain("vat-registration");
    expect(slugs).toContain("vat-and-sscl");
    expect(slugs).toContain("receipt-printer");
    expect(slugs).toContain("scale-labels");
    expect(slugs).toContain("backup-and-restore");
    expect(slugs).toContain("lan-sync-or-network-mode");
  });

  test("getArticlesByCategory filters articles by category slug", () => {
    const gettingStarted = getArticlesByCategory("getting-started", "en");
    expect(gettingStarted.length).toBeGreaterThanOrEqual(3);
    for (const a of gettingStarted) {
      expect(a.categorySlug).toBe("getting-started");
    }
  });

  test("getArticle resolves an exact locale match", () => {
    const article = getArticle("getting-started", "install", "en");
    expect(article).toBeDefined();
    expect(article?.slug).toBe("install");
    expect(article?.categorySlug).toBe("getting-started");
    expect(article?.isFallback).toBeFalsy();
    expect(article?.bodyMd).toContain("[A2]");
  });

  test("getArticle falls back to English when translation does not exist", () => {
    // smartscreen is only seeded in EN initially
    const article = getArticle("getting-started", "smartscreen", "si");
    expect(article).toBeDefined();
    expect(article?.slug).toBe("smartscreen");
    expect(article?.isFallback).toBe(true);
    expect(article?.bodyMd).toContain("[A5]");
  });

  test("getDocsNavigation returns prev and next articles in sequence", () => {
    const nav = getDocsNavigation("getting-started", "smartscreen", "en");
    expect(nav.prev).toBeDefined();
    expect(nav.prev?.slug).toBe("install");
    expect(nav.next).toBeDefined();
    expect(nav.next?.slug).toBe("first-login");
  });

  test("isTaxArticle identifies tax category articles for disclaimer injection", () => {
    const taxArticle = getArticle("tax", "vat-and-sscl", "en");
    expect(taxArticle).toBeDefined();
    if (taxArticle) {
      expect(isTaxArticle(taxArticle)).toBe(true);
    }

    const nonTaxArticle = getArticle("getting-started", "install", "en");
    expect(nonTaxArticle).toBeDefined();
    if (nonTaxArticle) {
      expect(isTaxArticle(nonTaxArticle)).toBe(false);
    }
  });
});
