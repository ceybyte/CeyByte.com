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
    <article className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/40 hover:bg-zinc-900/80">
      <div className="space-y-3">
        {/* Meta Strip */}
        <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.tags[0] && (
              <span className="rounded bg-zinc-800/80 px-2 py-0.5 font-semibold text-cyan-300 uppercase">
                {post.tags[0]}
              </span>
            )}
            {isAlsoInEnglish && (
              <span className="rounded border border-cyan-800/50 bg-cyan-950/60 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                EN
              </span>
            )}
          </div>
          <span className="text-zinc-500 uppercase">{timeLabel}</span>
        </div>

        {/* Title */}
        <h3 className="text-foreground line-clamp-2 text-lg font-bold tracking-tight transition-colors group-hover:text-cyan-300">
          <Link href={postUrl} className="focus:outline-none">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">{post.excerpt}</p>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs">
        <span className="font-mono text-zinc-500">{dateFormatted}</span>
        <Link
          href={postUrl}
          className="inline-flex items-center gap-1 font-semibold text-cyan-400 transition-colors transition-transform group-hover:translate-x-0.5 hover:text-cyan-300"
        >
          Read
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
