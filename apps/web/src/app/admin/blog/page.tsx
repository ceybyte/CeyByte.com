"use client";

import React, { useEffect, useState } from "react";
import { BlogList } from "@/features/admin/components/blog-list";
import { fetchAdminBlogPosts, type AdminBlogPost } from "@/features/admin/api";
import { Loader2 } from "lucide-react";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchAdminBlogPosts();
        setPosts(res.items);
      } catch {
        // Dev fallback if API not running
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Blog Articles</h1>
        <p className="text-xs text-text-muted">
          Manage announcements, tax guides, and merchant case studies
        </p>
      </div>
      <BlogList initialPosts={posts} />
    </div>
  );
}
