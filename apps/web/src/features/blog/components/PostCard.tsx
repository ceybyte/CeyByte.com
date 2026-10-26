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
    ? new Date(post.publishedAt).toLocaleDateString(locale === "en" ? "en-US" : locale === "si" ? "si-LK" : "ta-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const timeLabel = readingTimeLabel || `${post.readingMinutes} min read`;

  return (
    <article className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/40 hover:bg-zinc-900/80">
      <div className="space-y-3">
        {/* Meta Strip */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            {post.tags[0] && (
              <span className="rounded bg-zinc-800/80 px-2 py-0.5 font-semibold text-cyan-300 uppercase">
                {post.tags[0]}
              </span>
            )}
            {isAlsoInEnglish && (
              <span className="rounded bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono">
                EN
              </span>
            )}
          </div>
          <span className="text-zinc-500 uppercase">{timeLabel}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-cyan-300 transition-colors line-clamp-2">
          <Link href={postUrl} className="focus:outline-none">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between pt-3 border-t border-zinc-800/60 text-xs">
        <span className="font-mono text-zinc-500">{dateFormatted}</span>
        <Link
          href={postUrl}
          className="inline-flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group-hover:translate-x-0.5 transition-transform"
        >
          Read
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
