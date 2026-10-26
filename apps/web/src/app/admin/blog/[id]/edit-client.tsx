"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BlogEditor } from "@/features/admin/components/blog-editor";
import {
  fetchAdminBlogPost,
  createAdminBlogPost,
  updateAdminBlogPost,
  publishAdminBlogPost,
  type AdminBlogPost,
} from "@/features/admin/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface AdminBlogEditClientProps {
  id: string;
}

export function AdminBlogEditClient({ id }: AdminBlogEditClientProps) {
  const router = useRouter();
  const isNew = id === "new";

  const [post, setPost] = useState<AdminBlogPost | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    let mounted = true;

    async function load() {
      try {
        const item = await fetchAdminBlogPost(id);
        if (mounted) setPost(item);
      } catch {
        toast.error("Failed to load blog post details");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id, isNew]);

  const handleSave = async (data: Partial<AdminBlogPost>) => {
    if (isNew) {
      const res = await createAdminBlogPost(data);
      toast.success("Article created");
      router.push(`/admin/blog/${res.id}`);
    } else {
      const updated = await updateAdminBlogPost(id, data);
      setPost(updated);
      toast.success("Article updated");
    }
  };

  const handlePublish = async () => {
    if (isNew) {
      toast.error("Please save the article first before publishing");
      return;
    }
    const res = await publishAdminBlogPost(id);
    if (post) {
      setPost({ ...post, status: "published", publishedAt: res.publishedAt });
    }
    toast.success("Article published!");
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <BlogEditor post={post ?? undefined} onSave={handleSave} onPublish={!isNew ? handlePublish : undefined} />
  );
}
