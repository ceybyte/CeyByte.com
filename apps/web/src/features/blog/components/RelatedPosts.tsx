import React from "react";
import { PostCard } from "./PostCard";
import type { BlogPost } from "../types";

export interface RelatedPostsProps {
  posts: BlogPost[];
  locale: string;
  title?: string;
  readingTimeFormat?: (minutes: number) => string;
}

export function RelatedPosts({ posts, locale, title = "Related posts", readingTimeFormat }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-zinc-800 space-y-6">
      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            locale={locale}
            readingTimeLabel={readingTimeFormat ? readingTimeFormat(post.readingMinutes) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
