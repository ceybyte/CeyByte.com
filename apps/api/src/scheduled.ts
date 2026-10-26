import { donations } from "@cbpos/shared/db/schema";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import type { Db } from "./lib/db";

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
