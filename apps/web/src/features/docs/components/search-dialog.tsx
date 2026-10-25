"use client";

import React, { useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, CornerDownLeft, X, Loader2 } from "lucide-react";
import { search, type AnyOrama } from "@orama/orama";
import { restore } from "@orama/plugin-data-persistence";
import { useTranslations } from "next-intl";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

export interface SearchResultItem {
  id: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  locale: string;
  isFallback?: boolean;
}

interface RawSearchDoc {
  id: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  locale: string;
}

// In-memory cache for restored Orama DBs
const dbCache = new Map<string, AnyOrama>();

async function getOrLoadDb(loc: string) {
  if (dbCache.has(loc)) return dbCache.get(loc);

  try {
    const res = await fetch(`/search/${loc}.json`);
    if (!res.ok) return null;
    const jsonStr = await res.text();
    const db = await restore("json", jsonStr);
    dbCache.set(loc, db);
    return db;
  } catch (err) {
    console.error(`Failed to load search db for ${loc}:`, err);
    return null;
  }
}

export function DocsSearchDialog({ open, onOpenChange, locale }: SearchDialogProps) {
  const t = useTranslations("docs.search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts (⌘K, Ctrl+K, /)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        onOpenChange(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Execute Search with Locale-First Ranking & EN fallback (AC-05.1)
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function doSearch() {
      const currentDb = await getOrLoadDb(locale);
      const enDb = locale !== "en" ? await getOrLoadDb("en") : null;

      const items: SearchResultItem[] = [];
      const seenSlugs = new Set<string>();

      // 1. Search in current locale first
      if (currentDb) {
        const res = await search(currentDb, {
          term: trimmed,
          limit: 10,
        });

        for (const hit of res.hits) {
          const doc = hit.document as unknown as RawSearchDoc;
          if (!seenSlugs.has(doc.slug)) {
            seenSlugs.add(doc.slug);
            items.push({
              id: doc.id,
              slug: doc.slug,
              category: doc.category,
              title: doc.title,
              description: doc.description,
              locale: doc.locale,
              isFallback: false,
            });
          }
        }
      }

      // 2. If non-English locale, search English index for fallback items (AC-05.1)
      if (enDb) {
        const enRes = await search(enDb, {
          term: trimmed,
          limit: 10,
        });

        for (const hit of enRes.hits) {
          const doc = hit.document as unknown as RawSearchDoc;
          if (!seenSlugs.has(doc.slug)) {
            seenSlugs.add(doc.slug);
            items.push({
              id: doc.id,
              slug: doc.slug,
              category: doc.category,
              title: doc.title,
              description: doc.description,
              locale: "en",
              isFallback: true, // Tagged with EN badge
            });
          }
        }
      }

      if (!cancelled) {
        setResults(items);
        setSelectedIndex(0);
        setIsLoading(false);
      }
    }

    const timer = setTimeout(doSearch, 80);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, locale, open]);

  function handleSelect(item: SearchResultItem) {
    onOpenChange(false);
    startTransition(() => {
      const url =
        item.category === "blog"
          ? `/${locale}/blog/${item.slug}`
          : `/${locale}/docs/${item.category}/${item.slug}`;
      router.push(url);
    });
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onOpenChange(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0,
      );
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("trigger")}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-hairline bg-surface shadow-2xl transition-all">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-hairline px-4 py-3">
          <Search className="mr-3 h-4 w-4 shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t("placeholder")}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-azure" />}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-text-muted hover:text-text-primary"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() && results.length === 0 && !isLoading && (
            <div className="py-8 text-center text-xs text-text-muted">
              {t("noResults", { query })}
            </div>
          )}

          {results.length > 0 && (
            <ul className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-start justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? "bg-surface-elevated text-text-primary ring-1 ring-azure/50"
                          : "text-text-muted hover:bg-surface-elevated/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <FileText
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            isSelected ? "text-azure" : "text-text-muted"
                          }`}
                        />
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? "text-azure" : "text-text-primary"
                              }`}
                            >
                              {item.title}
                            </span>
                            {item.isFallback && (
                              <span className="rounded border border-azure/40 bg-azure/10 px-1 py-0.2 font-mono text-[10px] font-medium text-azure">
                                {t("fallbackBadge")}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="line-clamp-1 text-xs text-text-muted">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1.5 pt-0.5">
                        <span className="font-mono text-[10px] uppercase text-text-muted/70">
                          {item.category}
                        </span>
                        {isSelected && <CornerDownLeft className="h-3 w-3 text-azure" />}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-hairline bg-surface-elevated/40 px-4 py-2 text-[11px] font-mono text-text-muted">
          <div className="flex items-center gap-2">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
          <span>CB POS Docs</span>
        </div>
      </div>
    </div>
  );
}
