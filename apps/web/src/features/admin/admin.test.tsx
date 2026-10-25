import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { AdminNav } from "./components/admin-nav";
import { AdminTopbar } from "./components/admin-topbar";
import { AdminShortcutsModal } from "./components/admin-shortcuts-modal";
import { MerchantDrawer } from "./components/merchant-drawer";
import { DocsEditor } from "./components/docs-editor";
import type { AdminMerchant, AdminDocArticle } from "./api";

// Mock next/navigation
mock.module("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: () => {} }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("Admin Console UI (S14, F-08 M1)", () => {
  test("AdminNav renders modules and count badges", () => {
    const html = renderToString(
      <AdminNav
        counts={{
          merchants: 42,
          donations: 7,
          feedback: 12,
          docs: 11,
        }}
      />,
    );

    expect(html).toContain("Overview");
    expect(html).toContain("Merchants");
    expect(html).toContain("42");
    expect(html).toContain("Donations");
    expect(html).toContain("7");
    expect(html).toContain("Docs");
    expect(html).toContain("11");
    expect(html).toContain("Audit");
  });

  test("AdminTopbar renders search input with '/' keycap and environment", () => {
    const html = renderToString(<AdminTopbar />);
    expect(html).toContain("CB");
    expect(html).toContain("ADMIN");
    expect(html).toContain("PRODUCTION");
    expect(html).toContain("Search merchants, articles, releases...");
    expect(html).toContain("/");
  });

  test("AdminShortcutsModal renders keyboard shortcuts when open", () => {
    const html = renderToString(<AdminShortcutsModal open={true} onClose={() => {}} />);
    expect(html).toContain("Keyboard Shortcuts");
    expect(html).toContain("Focus search");
    expect(html).toContain("Go to Overview");
    expect(html).toContain("Go to Merchants");
    expect(html).toContain("Esc");
  });

  test("MerchantDrawer displays masked contacts and 'Reveal contact (logged)' button", () => {
    const mockMerchant: AdminMerchant = {
      id: "m_test123",
      publicId: "m_test12",
      fullName: "Nimal Perera",
      shopName: "Perera Stores",
      category: "grocery",
      district: "colombo",
      city: "Pettah",
      lat: 6.935,
      lng: 79.85,
      phone: "077****67",
      status: "listed",
      isPublicOnMap: true,
      isSupporter: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderToString(
      <MerchantDrawer merchant={mockMerchant} onClose={() => {}} onUpdate={() => {}} />,
    );

    expect(html).toContain("Perera Stores");
    expect(html).toContain("077****67");
    expect(html).toContain("Reveal contact (logged)");
    expect(html).toContain("Status &amp; Listing");
    expect(html).toContain("Save changes");
  });

  test("DocsEditor renders split pane with markdown source and preview", () => {
    const mockArticle: AdminDocArticle = {
      id: "art_1",
      categorySlug: "getting-started",
      slug: "install",
      locale: "en",
      title: "Installation & System Requirements",
      summary: "How to install CB POS",
      bodyMd: "# Windows Installation Steps",
      status: "published",
      sortOrder: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    const html = renderToString(
      <DocsEditor article={mockArticle} onClose={() => {}} onSaved={() => {}} />,
    );

    expect(html).toContain("Installation &amp; System Requirements");
    expect(html).toContain("Markdown Source");
    expect(html).toContain("Preview");
    expect(html).toContain("Windows Installation Steps");
    expect(html).toContain("Save Draft");
    expect(html).toContain("Publish &amp; Rebuild");
  });
});
