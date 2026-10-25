"use client";

import React, { useState } from "react";
import { X, Save, Send, Loader2, Eye } from "lucide-react";
import { AdminDocArticle, updateDocArticle, publishDocArticle } from "../api";
import { toast } from "sonner";

interface DocsEditorProps {
  article: AdminDocArticle | null;
  onClose: () => void;
  onSaved: (updated: AdminDocArticle) => void;
}

export function DocsEditor({ article, onClose, onSaved }: DocsEditorProps) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [bodyMd, setBodyMd] = useState(article?.bodyMd ?? "");
  const [status, setStatus] = useState<"draft" | "published">(article?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  if (!article) return null;

  async function handleSave() {
    if (!article) return;
    setSaving(true);
    try {
      const updated = await updateDocArticle(article.id, {
        title,
        summary,
        bodyMd,
        status,
      });
      toast.success("Draft saved successfully");
      onSaved(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save article";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!article) return;
    setPublishing(true);
    try {
      // First save changes
      await updateDocArticle(article.id, { title, summary, bodyMd, status: "published" });
      // Then publish + trigger rebuild
      await publishDocArticle(article.id);
      setStatus("published");
      toast.success("Article published and rebuild triggered!");
      onSaved({ ...article, title, summary, bodyMd, status: "published" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish article";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Docs editor"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
    >
      <div className="border-hairline bg-surface flex h-[90vh] w-full max-w-6xl flex-col rounded-lg border shadow-2xl">
        {/* Header */}
        <div className="border-hairline flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-text-primary text-base font-bold">
              Editing: <span className="text-azure font-mono">{article.slug}</span>
            </h2>
            <span className="bg-surface-elevated text-text-muted rounded px-2 py-0.5 font-mono text-[11px] uppercase">
              {article.locale}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                status === "published" ? "bg-azure/10 text-azure" : "bg-canvas text-text-muted"
              }`}
            >
              {status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="border-hairline bg-surface-elevated text-text-primary hover:border-azure/40 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="border-azure/40 bg-azure/10 text-azure hover:bg-azure/20 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold"
            >
              {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              <span>Publish & Rebuild</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary rounded p-1"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metadata Inputs */}
        <div className="border-hairline bg-canvas/40 grid grid-cols-1 gap-4 border-b px-6 py-3 sm:grid-cols-2">
          <div>
            <label htmlFor="doc-title-input" className="text-text-muted block text-[11px] font-medium">
              Title
            </label>
            <input
              id="doc-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-hairline bg-canvas text-text-primary focus:border-azure mt-1 h-8 w-full rounded border px-2.5 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="doc-summary-input" className="text-text-muted block text-[11px] font-medium">
              Summary
            </label>
            <input
              id="doc-summary-input"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="border-hairline bg-canvas text-text-primary focus:border-azure mt-1 h-8 w-full rounded border px-2.5 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Split Editor Pane */}
        <div className="divide-hairline grid flex-1 grid-cols-1 divide-y overflow-hidden sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {/* Left: Raw Markdown Editor */}
          <div className="bg-canvas flex flex-col p-4">
            <span className="text-text-muted mb-2 font-mono text-[11px]">Markdown Source</span>
            <textarea
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              placeholder="Write article in GitHub flavored markdown..."
              className="border-hairline bg-surface text-text-primary focus:border-azure flex-1 resize-none rounded border p-3 font-mono text-xs focus:outline-none"
            />
          </div>

          {/* Right: Live Preview */}
          <div className="bg-surface flex flex-col overflow-y-auto p-4">
            <span className="text-text-muted mb-2 flex items-center gap-1.5 font-mono text-[11px]">
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </span>
            <div className="prose prose-invert border-hairline bg-canvas max-w-none rounded border p-4 text-xs">
              <h1 className="text-text-primary text-base font-bold">{title || "Untitled Article"}</h1>
              {summary && <p className="text-text-muted italic">{summary}</p>}
              <hr className="border-hairline my-3" />
              <div className="text-text-primary font-sans whitespace-pre-wrap">
                {bodyMd || "No content entered yet."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
