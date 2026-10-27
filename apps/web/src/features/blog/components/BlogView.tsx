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

export function BlogView({ posts, alsoInEnglishPosts, locale, tagItems, copy }: BlogViewProps) {
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
      <TagFilterBar activeTag={activeTag} onSelectTag={setActiveTag} tags={tagItems} />

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
        <div className="border-hairline bg-surface/70 rounded-2xl border p-12 text-center shadow-xs backdrop-blur-sm">
          <p className="text-muted text-sm">{copy.empty}</p>
        </div>
      )}

      {/* Main Grid */}
      {gridPosts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gridPosts.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}

      {/* Also In English Section (for SI / TA when English articles exist without translation) */}
      {locale !== "en" && activeTag === "all" && alsoInEnglishPosts.length > 0 && (
        <section className="border-hairline mt-16 space-y-6 border-t pt-12">
          <div className="space-y-1">
            <h3 className="text-foreground flex items-center gap-2 text-xl font-bold tracking-tight">
              <span>{copy.alsoInEnglish}</span>
              <span className="border-azure/30 bg-azure/10 text-2xs text-azure-text rounded-full border px-2 py-0.5 font-mono font-semibold">
                EN
              </span>
            </h3>
            <p className="text-muted text-xs">{copy.alsoInEnglishLead}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {alsoInEnglishPosts.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} isAlsoInEnglish={true} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
