"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Send, Upload, Sparkles } from "lucide-react";
import type { AdminBlogPost } from "../api";
import { presignAdminBlogMedia } from "../api";
import { toast } from "sonner";

export interface BlogEditorProps {
  post?: Partial<AdminBlogPost>;
  onSave: (post: Partial<AdminBlogPost>) => Promise<void> | void;
  onPublish?: () => Promise<void> | void;
}

export function BlogEditor({ post, onSave, onPublish }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [locale, setLocale] = useState<"en" | "si" | "ta">(post?.locale || "en");
  const [translationKey, setTranslationKey] = useState(post?.translationKey || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [bodyMd, setBodyMd] = useState(post?.bodyMd || "");
  const [tags, setTags] = useState(post?.tags?.join(", ") || "");
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">(
    (post?.status as "draft" | "scheduled" | "published") || "draft",
  );
  const [coverImageKey, setCoverImageKey] = useState<string | null>(post?.coverImageKey || null);
  const [coverAlt, setCoverAlt] = useState(post?.coverAlt || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Auto-slugify when title changes if slug was empty
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!post?.id && (!slug || slug === slugify(title))) {
      const generated = slugify(val);
      setSlug(generated);
      if (!translationKey) setTranslationKey(generated);
    }
  };

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const presign = await presignAdminBlogMedia({
        fileName: file.name,
        contentType: file.type || "image/png",
        size: file.size,
        postId: post?.id || "draft",
      });

      // PUT directly to presigned URL
      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/png" },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload image file to storage");
      }

      setCoverImageKey(presign.key);
      toast.success("Cover image uploaded successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Media upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const insertDirective = (snippet: string) => {
    setBodyMd((prev) => `${prev}\n\n${snippet}\n\n`);
  };

  const handleSaveClick = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }
    setIsSaving(true);
    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        ...post,
        title,
        slug,
        locale,
        translationKey: translationKey || slug,
        excerpt,
        bodyMd,
        tags: tagArray,
        status,
        coverImageKey,
        coverAlt,
      });
      toast.success("Post saved successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishClick = async () => {
    if (!onPublish) return;
    setIsPublishing(true);
    try {
      await onPublish();
      setStatus("published");
      toast.success("Post published and rebuild dispatched");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {post?.id ? "Edit Article" : "New Article"}
            </h1>
            <p className="text-xs text-zinc-400">
              Live split-pane markdown authoring with AST preview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <Save className="h-3.5 w-3.5 text-zinc-400" />
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>

          {onPublish && (
            <button
              type="button"
              onClick={handlePublishClick}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/60 bg-cyan-950/70 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPublishing ? "Publishing..." : "Publish"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Split-Pane */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Pane: Meta Inputs & Markdown */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title..."
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-slug"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Language</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as "en" | "si" | "ta")}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value="en">English (en)</option>
                <option value="si">Sinhala (si)</option>
                <option value="ta">Tamil (ta)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Translation Key</label>
              <input
                type="text"
                value={translationKey}
                onChange={(e) => setTranslationKey(e.target.value)}
                placeholder="shared-group-key"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "scheduled" | "published")}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">Excerpt</label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary for social previews and card grids..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="releases, tax, stories"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Cover Image</label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-700 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isUploading ? "Uploading..." : "Upload Cover"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {coverImageKey && (
                  <span className="text-[11px] font-mono text-cyan-400 truncate max-w-[140px]">
                    {coverImageKey}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Markdown Helper Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2">
            <span className="text-[11px] font-mono text-zinc-500 mr-1">Directives:</span>
            <button
              type="button"
              onClick={() => insertDirective(':kbd[F3]')}
              className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-cyan-300 hover:bg-zinc-700"
            >
              :kbd[key]
            </button>
            <button
              type="button"
              onClick={() => insertDirective('::video{src="/media/video.mp4" alt="Guide" captions="/media/video.vtt"}')}
              className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-cyan-300 hover:bg-zinc-700"
            >
              ::video
            </button>
            <button
              type="button"
              onClick={() => insertDirective('::screenshot{src="/media/screen.png" alt="POS UI" caption="Receipt Settings"}')}
              className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-cyan-300 hover:bg-zinc-700"
            >
              ::screenshot
            </button>
            <button
              type="button"
              onClick={() => insertDirective(':::tip\nHelpful advice for shopkeepers.\n:::')}
              className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-cyan-300 hover:bg-zinc-700"
            >
              :::tip
            </button>
          </div>

          {/* Markdown Body Textarea */}
          <div>
            <textarea
              rows={18}
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              placeholder="# Article Title\n\nStart authoring in Markdown..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Pane: Live Preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm overflow-y-auto max-h-[800px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Live Preview
            </span>
            <span className="text-[11px] font-mono text-zinc-500 uppercase">{locale}</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {title || "Untitled Article"}
              </h1>
              {excerpt && <p className="text-sm text-zinc-400 leading-relaxed">{excerpt}</p>}
            </div>

            <div className="border-t border-zinc-800/80 pt-4 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {bodyMd || "Type markdown in the left pane to see live text..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
