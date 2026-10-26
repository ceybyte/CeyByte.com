"use client";

import React, { useState, useMemo } from "react";
import { TagFilterBar } from "./TagFilterBar";
import { FeaturedPostCard } from "./FeaturedPostCard";
import { PostCard } from "./PostCard";
import type { BlogPost, TagItem } from "../types";

export interface BlogViewProps {
  posts: BlogPost[];
  alsoInEnglishPosts: BlogPost[];
  locale: string;
  tagItems: TagItem[];
  copy: {
    empty: string;
    featured: string;
    alsoInEnglish: string;
    alsoInEnglishLead: string;
    readMore?: string;
  };
}

export function BlogView({
  posts,
  alsoInEnglishPosts,
  locale,
  tagItems,
  copy,
}: BlogViewProps) {
  const [activeTag, setActiveTag] = useState<string>("all");

  const featured = useMemo(() => {
    if (posts.length === 0) return undefined;
    const explicitlyFeatured = posts.find((p) => p.tags.includes("featured"));
    return explicitlyFeatured || posts[0];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeTag === "all") {
      return posts;
    }
    const tagLower = activeTag.toLowerCase();
    return posts.filter((p) => p.tags.some((t) => t.toLowerCase() === tagLower));
  }, [posts, activeTag]);

  // When activeTag is "all", we separate the featured hero from the grid
  const gridPosts = useMemo(() => {
    if (activeTag === "all" && featured) {
      return filteredPosts.filter((p) => p.id !== featured.id);
    }
    return filteredPosts;
  }, [filteredPosts, activeTag, featured]);

  return (
    <div className="space-y-10">
      {/* Tag Filters */}
      <TagFilterBar
        activeTag={activeTag}
        onSelectTag={setActiveTag}
        tags={tagItems}
      />

      {/* Featured Hero (shown only on 'all' filter and when posts exist) */}
      {activeTag === "all" && featured && (
        <FeaturedPostCard
          post={featured}
          locale={locale}
          featuredLabel={copy.featured}
          readMoreLabel={copy.readMore}
        />
      )}

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center backdrop-blur-sm">
          <p className="text-zinc-400 text-sm">{copy.empty}</p>
        </div>
      )}

      {/* Main Grid */}
      {gridPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridPosts.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}

      {/* Also In English Section (for SI / TA when English articles exist without translation) */}
      {locale !== "en" && activeTag === "all" && alsoInEnglishPosts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-zinc-800 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{copy.alsoInEnglish}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300">
                EN
              </span>
            </h3>
            <p className="text-xs text-zinc-400">{copy.alsoInEnglishLead}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alsoInEnglishPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                locale={locale}
                isAlsoInEnglish={true}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
