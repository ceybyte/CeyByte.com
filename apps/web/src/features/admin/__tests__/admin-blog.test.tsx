import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { BlogList } from "../components/blog-list";
import { BlogEditor } from "../components/blog-editor";
import type { AdminBlogPost } from "../api";

describe("Admin Blog Authoring Portal", () => {
  const mockPosts: AdminBlogPost[] = [
    {
      id: "b1",
      translationKey: "why-free",
      locale: "en",
      slug: "why-cb-pos-is-free-forever",
      title: "Why CB POS is Free Forever",
      excerpt: "Mission and donation model.",
      bodyMd: "# Free Forever\n\nFull article.",
      tags: ["releases", "stories"],
      status: "published",
      readingMinutes: 4,
      publishedAt: "2026-10-21T00:00:00.000Z",
    },
    {
      id: "b2",
      translationKey: "tax-guide",
      locale: "en",
      slug: "vat-sscl-mrp-calculation",
      title: "How CB POS Works Out VAT and SSCL from MRP",
      excerpt: "Dual-tax calculation breakdown.",
      bodyMd: "# VAT and SSCL\n\nDual-tax breakdown.",
      tags: ["tax"],
      status: "draft",
      readingMinutes: 6,
    },
  ];

  test("renders blog management table with status pills and actions", () => {
    const html = renderToString(<BlogList initialPosts={mockPosts} />);
    expect(html).toContain("Why CB POS is Free Forever");
    expect(html).toContain("How CB POS Works Out VAT and SSCL from MRP");
    expect(html).toContain("published");
    expect(html).toContain("draft");
  });

  test("renders split-pane blog editor with markdown textarea and preview", () => {
    const html = renderToString(<BlogEditor post={mockPosts[0]} onSave={() => {}} onPublish={() => {}} />);
    expect(html).toContain("Why CB POS is Free Forever");
    expect(html).toContain("why-cb-pos-is-free-forever");
    expect(html).toContain("Free Forever");
  });
});
