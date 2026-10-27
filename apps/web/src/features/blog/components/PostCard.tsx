import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "../types";

export interface PostCardProps {
  post: BlogPost;
  locale: string;
  readingTimeLabel?: string;
  isAlsoInEnglish?: boolean;
}

export function PostCard({ post, locale, readingTimeLabel, isAlsoInEnglish = false }: PostCardProps) {
  const postUrl = `/${locale}/blog/${post.slug}`;
  const dateFormatted = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        locale === "en" ? "en-US" : locale === "si" ? "si-LK" : "ta-LK",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      )
    : "";

  const timeLabel = readingTimeLabel || `${post.readingMinutes} min read`;

  return (
    <article className="group border-hairline bg-surface/70 hover:border-azure/40 hover:bg-surface-elevated/80 relative flex flex-col justify-between rounded-2xl border p-5 shadow-xs backdrop-blur-sm transition-all duration-200">
      <div className="space-y-3">
        {/* Meta Strip */}
        <div className="text-2xs text-muted flex items-center justify-between font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.tags[0] && (
              <span className="border-hairline bg-surface-elevated text-2xs text-azure-text rounded-full border px-2 py-0.5 font-semibold uppercase">
                {post.tags[0]}
              </span>
            )}
            {isAlsoInEnglish && (
              <span className="border-azure/30 bg-azure/10 text-azure-text rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                EN
              </span>
            )}
          </div>
          <span className="text-muted uppercase">{timeLabel}</span>
        </div>

        {/* Title */}
        <h3 className="text-foreground group-hover:text-azure-text line-clamp-2 text-lg font-bold tracking-tight transition-colors">
          <Link href={postUrl} className="focus:outline-none">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="text-muted line-clamp-3 text-sm leading-relaxed">{post.excerpt}</p>
      </div>

      {/* Footer */}
      <div className="border-hairline mt-5 flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted font-mono">{dateFormatted}</span>
        <Link
          href={postUrl}
          className="text-azure-text inline-flex items-center gap-1 font-semibold transition-all group-hover:translate-x-0.5 hover:underline"
        >
          Read
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
