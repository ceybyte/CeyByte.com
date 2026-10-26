"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit3, Trash2, Send, Clock, Globe } from "lucide-react";
import type { AdminBlogPost } from "../api";
import { publishAdminBlogPost, deleteAdminBlogPost } from "../api";
import { toast } from "sonner";

export interface BlogListProps {
  initialPosts: AdminBlogPost[];
}

export function BlogList({ initialPosts }: BlogListProps) {
  const [posts, setPosts] = useState<AdminBlogPost[]>(initialPosts);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const filtered = posts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePublish = async (post: AdminBlogPost) => {
    if (actionInProgress) return;
    setActionInProgress(post.id);
    try {
      const res = await publishAdminBlogPost(post.id);
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, status: "published", publishedAt: res.publishedAt } : item,
        ),
      );
      toast.success(`Published "${post.title}" and triggered site rebuild`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (post: AdminBlogPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    if (actionInProgress) return;
    setActionInProgress(post.id);
    try {
      await deleteAdminBlogPost(post.id);
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      toast.success("Post deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800 bg-emerald-950/70 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-300">
            published
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-800 bg-cyan-950/70 px-2.5 py-0.5 font-mono text-xs font-semibold text-cyan-300">
            <Clock className="h-3 w-3" />
            scheduled
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-800 bg-amber-950/70 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-300">
            draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 font-mono text-xs text-zinc-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {["all", "published", "draft", "scheduled"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs capitalize transition-colors ${
                statusFilter === st
                  ? "border border-cyan-700 bg-cyan-950/80 font-semibold text-cyan-300"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="h-8 w-48 rounded-md border border-zinc-800 bg-zinc-900/80 pr-3 pl-8 text-xs text-zinc-200 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/50 bg-cyan-950/50 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-900/40"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* Posts Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/40 font-mono text-zinc-400">
              <tr>
                <th className="px-4 py-3">Title & Slug</th>
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-mono text-zinc-500">
                    No blog articles found.
                  </td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-zinc-800/30">
                    <td className="px-4 py-3.5">
                      <div className="text-foreground line-clamp-1 font-semibold">{post.title}</div>
                      <div className="line-clamp-1 font-mono text-[11px] text-zinc-500">/{post.slug}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-400 uppercase">
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[11px]">
                        <Globe className="h-2.5 w-2.5 text-cyan-400" />
                        {post.locale}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(post.status)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-zinc-800/50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-400">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {post.status !== "published" && (
                          <button
                            type="button"
                            onClick={() => handlePublish(post)}
                            disabled={actionInProgress === post.id}
                            title="Publish article"
                            className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-emerald-950/60 hover:text-emerald-400"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/admin/blog/${post.id}`}
                          title="Edit article"
                          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-cyan-400"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          disabled={actionInProgress === post.id}
                          title="Delete article"
                          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-rose-950/60 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
