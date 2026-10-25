"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Search, HelpCircle, RefreshCw, Terminal, ExternalLink } from "lucide-react";
import { AdminShortcutsModal } from "./admin-shortcuts-modal";
import { triggerRebuild } from "../api";
import { toast } from "sonner";

interface AdminTopbarProps {
  onSearch?: (query: string) => void;
}

export function AdminTopbar({ onSearch }: AdminTopbarProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [isRebuilding, setIsRebuilding] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleRebuild() {
    setIsRebuilding(true);
    try {
      await triggerRebuild("admin_topbar_manual");
      toast.success("Site rebuild triggered successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger rebuild");
    } finally {
      setIsRebuilding(false);
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchVal(e.target.value);
    onSearch?.(e.target.value);
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-hairline bg-surface/90 px-4 backdrop-blur-md">
        {/* Left: Brand + Env */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-tight text-text-primary">
              CB<span className="text-azure">.</span>POS
            </span>
            <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
              ADMIN
            </span>
          </Link>
          <span className="hidden rounded border border-hairline bg-canvas px-2 py-0.5 font-mono text-[10px] text-text-muted sm:inline-block">
            PRODUCTION
          </span>
        </div>

        {/* Center: Search */}
        <div className="flex max-w-md flex-1 items-center px-4">
          <div className="relative w-full">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchVal}
              onChange={handleSearchChange}
              placeholder="Search merchants, articles, releases..."
              className="h-8 w-full rounded-md border border-hairline bg-canvas pr-8 pl-9 text-xs text-text-primary placeholder:text-text-muted focus:border-azure focus:outline-none focus:ring-1 focus:ring-azure"
            />
            <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
              /
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRebuild}
            disabled={isRebuilding}
            title="Trigger static rebuild on GitHub Actions"
            className="hidden items-center gap-1.5 rounded-md border border-hairline bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-text-muted hover:border-azure/40 hover:text-text-primary sm:inline-flex"
          >
            <RefreshCw className={`h-3 w-3 ${isRebuilding ? "animate-spin text-azure" : ""}`} />
            <span>Rebuild</span>
          </button>

          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-surface-elevated text-text-muted hover:text-text-primary"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <Link
            href="/en"
            target="_blank"
            rel="noopener noreferrer"
            title="Open public website"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-surface-elevated text-text-muted hover:text-text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <AdminShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
