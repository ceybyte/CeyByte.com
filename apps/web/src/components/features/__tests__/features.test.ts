/// <reference types="bun-types" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "bun:test";

function loadMessages(locale: string): Record<string, unknown> {
  const root = resolve(__dirname, "../../../../../..");
  const path = resolve(root, `messages/${locale}.json`);
  return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
}

describe("Features Page & Category Switcher Logic", () => {
  it("maintains 100% trilingual key parity across en, si, and ta featuresPage dictionaries", () => {
    const enMessages = loadMessages("en");
    const siMessages = loadMessages("si");
    const taMessages = loadMessages("ta");

    function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
      return Object.keys(obj).flatMap((key) => {
        const val = obj[key];
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          return getKeys(val as Record<string, unknown>, nextPrefix);
        }
        return [nextPrefix];
      });
    }

    const enKeys = getKeys(enMessages.featuresPage as Record<string, unknown>).sort();
    const siKeys = getKeys(siMessages.featuresPage as Record<string, unknown>).sort();
    const taKeys = getKeys(taMessages.featuresPage as Record<string, unknown>).sort();

    expect(enKeys.length).toBeGreaterThan(30);
    expect(siKeys).toEqual(enKeys);
    expect(taKeys).toEqual(enKeys);
  });

  it("verifies all 4 retail shop categories are present with challenge, solution, and 4 features each", () => {
    const enMessages = loadMessages("en");
    const fp = enMessages.featuresPage as {
      categories: Record<
        string,
        {
          label: string;
          headline: string;
          problem: string;
          solution: string;
          f1_title: string;
          f2_title: string;
          f3_title: string;
          f4_title: string;
        }
      >;
    };

    const expectedCategories = ["grocery", "pharmacy", "hardware", "apparel"];
    expect(Object.keys(fp.categories)).toEqual(expectedCategories);

    for (const catKey of expectedCategories) {
      const cat = fp.categories[catKey];
      expect(cat?.label.length).toBeGreaterThan(0);
      expect(cat?.headline.length).toBeGreaterThan(0);
      expect(cat?.problem.length).toBeGreaterThan(0);
      expect(cat?.solution.length).toBeGreaterThan(0);
      expect(cat?.f1_title.length).toBeGreaterThan(0);
      expect(cat?.f2_title.length).toBeGreaterThan(0);
      expect(cat?.f3_title.length).toBeGreaterThan(0);
      expect(cat?.f4_title.length).toBeGreaterThan(0);
    }
  });

  it("verifies comparison matrix rows exist and cite zero cost and offline resilience", () => {
    const enMessages = loadMessages("en");
    const fp = enMessages.featuresPage as {
      matrix: {
        rows: Record<string, { feature: string; cbpos: string; typical: string; enterprise: string }>;
      };
    };

    expect(fp.matrix.rows.cost?.cbpos).toContain("Rs. 0");
    expect(fp.matrix.rows.offline?.cbpos).toContain("Offline");
    expect(fp.matrix.rows.tax?.cbpos).toContain("18% VAT");
  });
});
