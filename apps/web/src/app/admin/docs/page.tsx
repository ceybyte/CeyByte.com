"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Folder, Edit3, RefreshCw } from "lucide-react";
import { AdminDocArticle, AdminDocCategory, fetchDocsCategories, triggerRebuild } from "@/features/admin/api";
import { DocsEditor } from "@/features/admin/components/docs-editor";
import { toast } from "sonner";

// Static seed preview fallback for docs management
const SEED_ARTICLES: AdminDocArticle[] = [
  { id: "1", categorySlug: "getting-started", slug: "install", locale: "en", title: "Installation & System Requirements", summary: "How to download and install CB POS on Windows 10/11", bodyMd: "# Installation\n\nDownload the setup file...", status: "published", sortOrder: 1, createdAt: 1, updatedAt: 1 },
  { id: "2", categorySlug: "getting-started", slug: "smartscreen", locale: "en", title: "Windows SmartScreen & Antivirus Guide", summary: "Resolving SmartScreen prompt on unsigned builds", bodyMd: "# SmartScreen\n\nClick More info...", status: "published", sortOrder: 2, createdAt: 1, updatedAt: 1 },
  { id: "3", categorySlug: "getting-started", slug: "first-login", locale: "en", title: "First Login & Initial Setup", summary: "Setting up admin PIN and basic shop details", bodyMd: "# First Login\n\nDefault PIN...", status: "published", sortOrder: 3, createdAt: 1, updatedAt: 1 },
  { id: "4", categorySlug: "cashiering", slug: "first-sale", locale: "en", title: "Making Your First Sale", summary: "Scanning items and issuing printed receipts", bodyMd: "# First Sale\n\nPress F2...", status: "published", sortOrder: 1, createdAt: 1, updatedAt: 1 },
  { id: "5", categorySlug: "cashiering", slug: "keyboard-shortcuts", locale: "en", title: "Keyboard Shortcuts Cheat Sheet", summary: "Full cashiering shortcuts list [B1]", bodyMd: "# Shortcuts\n\nF1 Help...", status: "published", sortOrder: 2, createdAt: 1, updatedAt: 1 },
  { id: "6", categorySlug: "tax", slug: "vat-registration", locale: "en", title: "VAT Registration & Requirements", summary: "18% VAT setup in Sri Lanka", bodyMd: "# VAT Registration\n\nIRD rules...", status: "published", sortOrder: 1, createdAt: 1, updatedAt: 1 },
  { id: "7", categorySlug: "tax", slug: "vat-and-sscl", locale: "en", title: "Configuring 18% VAT and 2.5% SSCL", summary: "Applying dual taxes to shelf prices", bodyMd: "# VAT and SSCL\n\nCalculation...", status: "published", sortOrder: 2, createdAt: 1, updatedAt: 1 },
  { id: "8", categorySlug: "hardware", slug: "receipt-printer", locale: "en", title: "Setting up ESC/POS Thermal Printers", summary: "58mm and 80mm USB receipt printers", bodyMd: "# Receipt Printer\n\nESC/POS...", status: "published", sortOrder: 1, createdAt: 1, updatedAt: 1 },
  { id: "9", categorySlug: "hardware", slug: "scale-labels", locale: "en", title: "Configuring Weight Scale Barcodes", summary: "Parsing EAN-13 price-embedded barcodes", bodyMd: "# Scale Labels\n\nPrefix 21...", status: "published", sortOrder: 2, createdAt: 1, updatedAt: 1 },
  { id: "10", categorySlug: "troubleshooting", slug: "backup-and-restore", locale: "en", title: "Database Backup and Restore", summary: "Automatic daily backups and SQLite file location", bodyMd: "# Backup\n\nAppData...", status: "published", sortOrder: 1, createdAt: 1, updatedAt: 1 },
  { id: "11", categorySlug: "troubleshooting", slug: "lan-sync-or-network-mode", locale: "en", title: "LAN Sync & Multi-Counter Billing", summary: "Peer-to-peer sync between cash counters", bodyMd: "# LAN Sync\n\nPort 8787...", status: "published", sortOrder: 2, createdAt: 1, updatedAt: 1 },
];

export default function AdminDocsPage() {
  const [categories, setCategories] = useState<AdminDocCategory[]>([]);
  const [articles, setArticles] = useState<AdminDocArticle[]>(SEED_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<AdminDocArticle | null>(null);
  const [rebuilding, setRebuilding] = useState(false);

  useEffect(() => {
    async function loadCats() {
      try {
        const res = await fetchDocsCategories();
        if (res.items.length > 0) setCategories(res.items);
      } catch {
        // Fallback categories
        setCategories([
          { id: "1", slug: "getting-started", nameEn: "Getting Started", sortOrder: 1 },
          { id: "2", slug: "cashiering", nameEn: "Cashiering", sortOrder: 2 },
          { id: "3", slug: "inventory", nameEn: "Inventory", sortOrder: 3 },
          { id: "4", slug: "tax", nameEn: "Tax", sortOrder: 4 },
          { id: "5", slug: "hardware", nameEn: "Hardware", sortOrder: 5 },
          { id: "6", slug: "troubleshooting", nameEn: "Troubleshooting", sortOrder: 6 },
        ]);
      }
    }
    loadCats();
  }, []);

  async function handleReindex() {
    setRebuilding(true);
    try {
      await triggerRebuild("admin_docs_reindex");
      toast.success("Search index rebuild triggered on GitHub Actions");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger reindex";
      toast.error(msg);
    } finally {
      setRebuilding(false);
    }
  }

  function handleArticleSaved(updated: AdminDocArticle) {
    setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedArticle(updated);
  }

  const filteredArticles =
    selectedCategory === "all"
      ? articles
      : articles.filter((a) => a.categorySlug === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Documentation CMS</h1>
          <p className="text-xs text-text-muted">
            Manage multilingual documentation articles and search indexes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReindex}
            disabled={rebuilding}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-muted hover:border-azure/40 hover:text-text-primary"
          >
            <RefreshCw className={`h-3 w-3 ${rebuilding ? "animate-spin text-azure" : ""}`} />
            <span>Rebuild search index</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Left: Category tree */}
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="mb-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
            Categories ({categories.length})
          </h2>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs transition-colors ${
                selectedCategory === "all"
                  ? "bg-azure/10 font-semibold text-azure"
                  : "text-text-muted hover:bg-surface-elevated hover:text-text-primary"
              }`}
            >
              <span>All Articles</span>
              <span className="font-mono text-[11px]">{articles.length}</span>
            </button>
            {categories.map((c) => {
              const count = articles.filter((a) => a.categorySlug === c.slug).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs transition-colors ${
                    selectedCategory === c.slug
                      ? "bg-azure/10 font-semibold text-azure"
                      : "text-text-muted hover:bg-surface-elevated hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-3.5 w-3.5" />
                    <span>{c.nameEn}</span>
                  </div>
                  <span className="font-mono text-[11px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Articles Table */}
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hairline bg-surface-elevated text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Article Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Translations</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredArticles.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedArticle(a)}
                    className="h-11 cursor-pointer transition-colors hover:bg-surface-elevated/60"
                  >
                    <td className="px-4 py-2 font-medium text-text-primary">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-azure" />
                        <span>{a.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-text-muted capitalize">{a.categorySlug}</td>
                    <td className="px-4 py-2 font-mono text-text-muted">{a.slug}</td>
                    <td className="px-4 py-2">
                      {/* Translation Status Dots EN / SI / TA */}
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="flex items-center gap-0.5 text-azure">
                          <span className="h-1.5 w-1.5 rounded-full bg-azure" />
                          <span>EN</span>
                        </span>
                        <span className="flex items-center gap-0.5 text-text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70" />
                          <span>SI</span>
                        </span>
                        <span className="flex items-center gap-0.5 text-text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-surface-elevated border border-hairline" />
                          <span>TA</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          a.status === "published"
                            ? "bg-azure/10 text-azure"
                            : "bg-surface-elevated text-text-muted"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArticle(a);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-hairline bg-surface-elevated px-2 py-1 text-[11px] font-medium text-text-muted hover:text-text-primary"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Split Editor Modal */}
      <DocsEditor
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onSaved={handleArticleSaved}
      />
    </div>
  );
}
