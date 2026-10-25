import { describe, it, expect } from "bun:test";
import { getAllLegalSlugs, getLegalDoc } from "./content";
import type { LegalSlug } from "./types";

describe("Legal Content Provider", () => {
  it("provides all 6 required legal document slugs", () => {
    const slugs = getAllLegalSlugs();
    const expectedSlugs: LegalSlug[] = [
      "terms",
      "eula",
      "privacy",
      "tax-disclaimer",
      "data-safety",
      "cookies",
    ];
    expect(slugs).toEqual(expectedSlugs);
  });

  it("retrieves document with summary and numbered sections", () => {
    const doc = getLegalDoc("tax-disclaimer");
    expect(doc).not.toBeNull();
    expect(doc?.titleKey).toBe("legal.tax.title");
    expect(doc?.summaryKey).toBe("legal.tax.summary");
    expect(doc?.sections.length).toBeGreaterThan(0);
  });

  it("returns null for unknown slugs", () => {
    const doc = getLegalDoc("non-existent");
    expect(doc).toBeNull();
  });
});
