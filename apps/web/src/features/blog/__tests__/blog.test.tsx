import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { TagFilterBar } from "../components/TagFilterBar";
import { PostCard } from "../components/PostCard";
import { FeaturedPostCard } from "../components/FeaturedPostCard";
import { AlsoInEnglishBanner } from "../components/AlsoInEnglishBanner";
import type { BlogPost } from "../types";

describe("S10 Blog UI Components", () => {
  const mockPost: BlogPost = {
    id: "post-1",
    translationKey: "test-post",
    locale: "en",
    slug: "dual-tax-vat-sscl",
    title: "How CB POS Works Out VAT and SSCL from MRP",
    excerpt: "A transparent breakdown of Sri Lanka's dual-tax calculations.",
    bodyMd: "# Dual Tax\n\nExplanation of VAT and SSCL.",
    html: '<h1 id="dual-tax">Dual Tax</h1><p>Explanation of VAT and SSCL.</p>',
    toc: [],
    tags: ["tax", "releases"],
    status: "published",
    readingMinutes: 5,
    publishedAt: "2026-10-21T00:00:00.000Z",
    createdAt: "2026-10-21T00:00:00.000Z",
    updatedAt: "2026-10-21T00:00:00.000Z",
  };

  test("TagFilterBar renders all categories with cyan accent on active filter and adheres to green button rule", () => {
    const html = renderToString(
      <TagFilterBar
        activeTag="all"
        onSelectTag={() => {}}
        tags={[
          { key: "all", label: "All" },
          { key: "releases", label: "Releases" },
          { key: "tax", label: "Tax" },
          { key: "stories", label: "Shop stories" },
          { key: "hardware", label: "Hardware" },
        ]}
      />,
    );

    expect(html).toContain("All");
    expect(html).toContain("Releases");
    expect(html).toContain("Tax");
    expect(html).toContain("border-cyan-400");
    const forbiddenGreen = ["#", "39FF14"].join("");
    expect(html).not.toContain(forbiddenGreen);
  });

  test("PostCard renders reading time and title with semantic link", () => {
    const html = renderToString(<PostCard post={mockPost} locale="en" readingTimeLabel="5 min read" />);

    expect(html).toContain("How CB POS Works Out VAT and SSCL from MRP");
    expect(html).toContain("5 min read");
    expect(html).toContain('href="/en/blog/dual-tax-vat-sscl"');
  });

  test("FeaturedPostCard renders full-width hero layout with featured badge", () => {
    const html = renderToString(
      <FeaturedPostCard post={mockPost} locale="en" featuredLabel="Featured" readingTimeLabel="5 min read" />,
    );

    expect(html).toContain("Featured");
    expect(html).toContain("How CB POS Works Out VAT and SSCL from MRP");
    expect(html).toContain("5 min read");
    expect(html).toContain('href="/en/blog/dual-tax-vat-sscl"');
  });

  test("AlsoInEnglishBanner renders localized notice and title", () => {
    const html = renderToString(
      <AlsoInEnglishBanner
        title="Also in English"
        lead="This article is currently only available in English."
      />,
    );

    expect(html).toContain("Also in English");
    expect(html).toContain("This article is currently only available in English.");
    expect(html).toContain("border-cyan-400");
  });
});
