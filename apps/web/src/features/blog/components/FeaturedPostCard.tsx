import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { BlogPost } from "../types";

export interface FeaturedPostCardProps {
  post: BlogPost;
  locale: string;
  featuredLabel?: string;
  readingTimeLabel?: string;
  readMoreLabel?: string;
}

export function FeaturedPostCard({
  post,
  locale,
  featuredLabel = "Featured",
  readingTimeLabel,
  readMoreLabel = "Read article",
}: FeaturedPostCardProps) {
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
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-8 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:bg-zinc-900/80">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8 items-center">
        {/* Visual Cover / Placeholder */}
        <div className="md:col-span-5 aspect-[16/9] w-full overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-cyan-950/30 flex flex-col justify-between p-6 relative">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase text-cyan-300">
              <Sparkles className="h-3 w-3" />
              {featuredLabel}
            </span>
            <span className="text-[11px] font-mono text-zinc-500 uppercase">
              {post.tags[0] || "CB POS"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono text-cyan-400/70">CEYBYTE EDITORIAL</div>
            <div className="text-sm font-semibold text-zinc-300 line-clamp-1">{post.title}</div>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span className="font-semibold uppercase tracking-wider">{featuredLabel}</span>
            {dateFormatted && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400 uppercase">{dateFormatted}</span>
              </>
            )}
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400 uppercase">{timeLabel}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground group-hover:text-cyan-300 transition-colors">
            <Link href={postUrl} className="focus:outline-none">
              {post.title}
            </Link>
          </h2>

          <p className="text-zinc-400 text-sm md:text-base leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>

          <div className="pt-2">
            <Link
              href={postUrl}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group-hover:translate-x-1 transition-transform"
            >
              {readMoreLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
