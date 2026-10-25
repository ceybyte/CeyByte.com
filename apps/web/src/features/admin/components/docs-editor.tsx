"use client";

import React, { useState } from "react";
import { X, Save, Send, Loader2, SplitSquareVertical, Eye } from "lucide-react";
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
  const [status, setStatus] = useState<"draft" | "published">(
    article?.status ?? "draft",
  );
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
    } catch (err: any) {
      toast.error(err.message || "Failed to save article");
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
    } catch (err: any) {
      toast.error(err.message || "Failed to publish article");
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
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-lg border border-hairline bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-text-primary">
              Editing: <span className="font-mono text-azure">{article.slug}</span>
            </h2>
            <span className="rounded bg-surface-elevated px-2 py-0.5 font-mono text-[11px] text-text-muted uppercase">
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
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-primary hover:border-azure/40"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 rounded-md border border-azure/40 bg-azure/10 px-3 py-1.5 text-xs font-semibold text-azure hover:bg-azure/20"
            >
              {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              <span>Publish & Rebuild</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 gap-4 border-b border-hairline bg-canvas/40 px-6 py-3 sm:grid-cols-2">
          <div>
            <label htmlFor="doc-title-input" className="block text-[11px] font-medium text-text-muted">
              Title
            </label>
            <input
              id="doc-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 h-8 w-full rounded border border-hairline bg-canvas px-2.5 text-xs text-text-primary focus:border-azure focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="doc-summary-input" className="block text-[11px] font-medium text-text-muted">
              Summary
            </label>
            <input
              id="doc-summary-input"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1 h-8 w-full rounded border border-hairline bg-canvas px-2.5 text-xs text-text-primary focus:border-azure focus:outline-none"
            />
          </div>
        </div>

        {/* Split Editor Pane */}
        <div className="grid flex-1 grid-cols-1 divide-y divide-hairline overflow-hidden sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {/* Left: Raw Markdown Editor */}
          <div className="flex flex-col bg-canvas p-4">
            <span className="mb-2 text-[11px] font-mono text-text-muted">Markdown Source</span>
            <textarea
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              placeholder="Write article in GitHub flavored markdown..."
              className="flex-1 resize-none rounded border border-hairline bg-surface p-3 font-mono text-xs text-text-primary focus:border-azure focus:outline-none"
            />
          </div>

          {/* Right: Live Preview */}
          <div className="flex flex-col overflow-y-auto bg-surface p-4">
            <span className="mb-2 flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </span>
            <div className="prose prose-invert max-w-none rounded border border-hairline bg-canvas p-4 text-xs">
              <h1 className="text-base font-bold text-text-primary">{title || "Untitled Article"}</h1>
              {summary && <p className="italic text-text-muted">{summary}</p>}
              <hr className="my-3 border-hairline" />
              <div className="whitespace-pre-wrap font-sans text-text-primary">
                {bodyMd || "No content entered yet."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
