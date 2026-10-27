import Link from "next/link";
import { ArrowRight, Bookmark } from "lucide-react";
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
    <article className="group border-hairline bg-surface/70 hover:border-azure/40 hover:bg-surface-elevated/70 relative overflow-hidden rounded-2xl border p-6 shadow-xs backdrop-blur-sm transition-all duration-300 md:p-8">
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-8">
        {/* Visual Cover / Placeholder */}
        <div className="border-hairline from-surface via-surface-elevated to-azure/10 relative flex aspect-[16/9] w-full flex-col justify-between overflow-hidden rounded-xl border bg-gradient-to-br p-6 md:col-span-5">
          <div className="flex items-center justify-between">
            <span className="border-azure/30 bg-azure/10 text-2xs text-azure-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono font-semibold uppercase">
              <Bookmark className="h-3 w-3" />
              {featuredLabel}
            </span>
            <span className="text-2xs text-muted font-mono uppercase">{post.tags[0] || "CB POS"}</span>
          </div>

          <div className="space-y-1">
            <div className="text-2xs text-azure-text font-mono font-semibold tracking-wider">
              CEYLON BYTE EDITORIAL
            </div>
            <div className="text-text line-clamp-1 text-sm font-semibold">{post.title}</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center space-y-4 md:col-span-7">
          <div className="text-azure-text flex items-center gap-2 font-mono text-xs">
            <span className="font-semibold tracking-wider uppercase">{featuredLabel}</span>
            {dateFormatted && (
              <>
                <span className="text-muted/60">·</span>
                <span className="text-muted uppercase">{dateFormatted}</span>
              </>
            )}
            <span className="text-muted/60">·</span>
            <span className="text-muted uppercase">{timeLabel}</span>
          </div>

          <h2 className="text-foreground group-hover:text-azure-text text-2xl font-extrabold tracking-tight transition-colors md:text-3xl">
            <Link href={postUrl} className="focus:outline-none">
              {post.title}
            </Link>
          </h2>

          <p className="text-muted line-clamp-3 text-sm leading-relaxed md:text-base">{post.excerpt}</p>

          <div className="pt-2">
            <Link
              href={postUrl}
              className="text-azure-text inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:translate-x-1 hover:underline"
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
