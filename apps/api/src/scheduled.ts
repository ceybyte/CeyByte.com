import { blogPosts, donations } from "@cbpos/shared/db/schema";
import { and, eq, isNotNull, lt, lte } from "drizzle-orm";
import type { Db } from "./lib/db";
import { triggerRebuild } from "./lib/rebuild";
import { auditInsert } from "./lib/audit";

/**
 * Daily cron cleanup for donations:
 * 1. Cancels abandoned donations in awaiting_payment status older than 14 days.
 * 2. Purges R2 slip objects for rejected donations older than 90 days.
 */
export async function cleanupDonations(
  env: { UPLOADS?: R2Bucket },
  db: Db,
): Promise<{ cancelledCount: number; purgedSlipsCount: number }> {
  const now = Date.now();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 3600 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 3600 * 1000);

  // 1. Cancel abandoned awaiting_payment donations older than 14 days
  const abandoned = await db
    .select({ id: donations.id })
    .from(donations)
    .where(and(eq(donations.status, "awaiting_payment"), lt(donations.createdAt, fourteenDaysAgo)));

  let cancelledCount = 0;
  for (const item of abandoned) {
    await db
      .update(donations)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(donations.id, item.id));
    cancelledCount++;
  }

  // 2. Purge R2 slip objects for rejected donations older than 90 days
  const rejectedOld = await db
    .select({ id: donations.id, slipKey: donations.slipKey })
    .from(donations)
    .where(
      and(
        eq(donations.status, "rejected"),
        isNotNull(donations.slipKey),
        lt(donations.updatedAt, ninetyDaysAgo),
      ),
    );

  let purgedSlipsCount = 0;
  for (const item of rejectedOld) {
    if (item.slipKey) {
      if (env.UPLOADS) {
        await env.UPLOADS.delete(item.slipKey);
      }
      await db
        .update(donations)
        .set({
          slipKey: null,
          slipMime: null,
          slipSize: null,
          updatedAt: new Date(),
        })
        .where(eq(donations.id, item.id));
      purgedSlipsCount++;
    }
  }

  return { cancelledCount, purgedSlipsCount };
}

/**
 * Cron task to activate scheduled blog posts that have reached their publishedAt time.
 * If any posts transition to published, triggers site rebuild.
 */
export async function checkScheduledPosts(env: Env, db: Db): Promise<{ publishedCount: number }> {
  const now = new Date();
  const duePosts = await db
    .select({ id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug, locale: blogPosts.locale })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "scheduled"), lte(blogPosts.publishedAt, now)));

  let publishedCount = 0;
  for (const post of duePosts) {
    await db
      .update(blogPosts)
      .set({
        status: "published",
        updatedAt: now,
      })
      .where(eq(blogPosts.id, post.id));

    await auditInsert(db, {
      actorUserId: null,
      action: "post.publish_scheduled",
      entityType: "post",
      entityId: post.id,
      diff: {
        before: { status: "scheduled" },
        after: { status: "published" },
        note: `Automatically published scheduled post "${post.title}"`,
      },
    });

    publishedCount++;
  }

  if (publishedCount > 0) {
    await triggerRebuild(env, "scheduled_blog_publish");
  }

  return { publishedCount };
}
