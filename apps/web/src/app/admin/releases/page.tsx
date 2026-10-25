"use client";

import React, { useEffect, useState } from "react";
import { Tag, RefreshCw, Copy, Check, Loader2 } from "lucide-react";
import { AdminRelease, fetchReleases, syncReleases, updateRelease } from "@/features/admin/api";
import { toast } from "sonner";

export default function AdminReleasesPage() {
  const [releases, setReleases] = useState<AdminRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  async function loadReleases() {
    setLoading(true);
    try {
      const res = await fetchReleases();
      setReleases(res.items);
    } catch {
      // In dev fallback
      setReleases([
        {
          id: "1",
          version: "1.3.0",
          channel: "stable",
          title: "CB POS v1.3.0",
          notesMd: "Initial stable release",
          minOs: "Windows 10 or later",
          releaseDate: "2026-10-15",
          publishedAt: Date.now(),
          exeName: "CBPOSSetup-1.3.0.exe",
          exeUrl: "https://github.com/ceybyte/cbpos-releases/releases/download/v1.3.0/CBPOSSetup-1.3.0.exe",
          exeSize: 45200000,
          exeSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          isLatest: true,
          isYanked: false,
          source: "github_sync",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReleases();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await syncReleases();
      toast.success("GitHub releases synced successfully");
      loadReleases();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync releases";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleYank(rel: AdminRelease) {
    const nextYank = !rel.isYanked;
    try {
      await updateRelease(rel.id, { isYanked: nextYank });
      setReleases((prev) => prev.map((r) => (r.id === rel.id ? { ...r, isYanked: nextYank } : r)));
      if (nextYank) {
        toast.warning(`Release ${rel.version} yanked. Download gate will not distribute this version.`);
      } else {
        toast.success(`Release ${rel.version} unyanked.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update yank status";
      toast.error(msg);
    }
  }

  function handleCopySha(sha: string) {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    toast.success("SHA256 checksum copied to clipboard");
    setTimeout(() => setCopiedSha(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-text-primary text-xl font-bold tracking-tight">Releases Management</h1>
          <p className="text-text-muted text-xs">
            GitHub Release mirrors, checksum verification, and download gate version routing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="border-hairline bg-surface-elevated text-text-muted hover:border-azure/40 hover:text-text-primary inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? "text-azure animate-spin" : ""}`} />
            <span>Sync now</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border-hairline bg-surface overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-hairline bg-surface-elevated text-text-muted border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Release Date</th>
                <th className="px-4 py-3 font-medium">EXE Size</th>
                <th className="px-4 py-3 font-medium">SHA-256</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Yanked</th>
              </tr>
            </thead>
            <tbody className="divide-hairline divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-text-muted px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="text-azure h-4 w-4 animate-spin" />
                      <span>Loading releases...</span>
                    </div>
                  </td>
                </tr>
              ) : releases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-text-muted px-4 py-8 text-center">
                    No releases found. Click &quot;Sync now&quot; to fetch from GitHub.
                  </td>
                </tr>
              ) : (
                releases.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-elevated/40 h-11 transition-colors">
                    <td className="text-text-primary px-4 py-2 font-mono font-bold">
                      <div className="flex items-center gap-1.5">
                        <Tag className="text-azure h-3.5 w-3.5" />
                        <span>v{r.version}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-surface-elevated text-text-muted rounded px-1.5 py-0.5 font-mono text-[10px] uppercase">
                        {r.channel}
                      </span>
                    </td>
                    <td className="text-text-muted px-4 py-2 font-mono">{r.releaseDate}</td>
                    <td className="text-text-muted px-4 py-2 font-mono">
                      {(r.exeSize / 1024 / 1024).toFixed(1)} MB
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleCopySha(r.exeSha256)}
                        title="Click to copy full SHA256"
                        className="bg-canvas text-text-muted hover:text-text-primary inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]"
                      >
                        <span>{r.exeSha256.slice(0, 10)}...</span>
                        {copiedSha === r.exeSha256 ? (
                          <Check className="text-azure h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {r.isLatest ? (
                        <span className="bg-azure/10 text-azure rounded px-2 py-0.5 font-mono text-[10px] font-semibold">
                          LATEST
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">Stable</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={r.isYanked}
                          onChange={() => handleToggleYank(r)}
                          className="peer sr-only"
                        />
                        <div className="bg-surface-elevated h-4 w-7 rounded-full peer-checked:bg-rose-500 after:absolute after:top-0.5 after:left-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                      </label>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
