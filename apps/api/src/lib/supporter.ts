import { donations, merchants } from "@cbpos/shared/db/schema";
import { and, count, eq } from "drizzle-orm";
import type { Db } from "./db";

/**
 * Recomputes isSupporter and supporterSince for a merchant based on approved donations.
 * Returns true if the merchant is a supporter.
 */
export async function recomputeSupporter(db: Db, merchantId: string): Promise<boolean> {
  const [res] = await db
    .select({ n: count() })
    .from(donations)
    .where(and(eq(donations.merchantId, merchantId), eq(donations.status, "approved")));

  const approvedCount = res?.n ?? 0;
  const isSupporter = approvedCount > 0;

  if (isSupporter) {
    const m = await db
      .select({ supporterSince: merchants.supporterSince })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .get();

    await db
      .update(merchants)
      .set({
        isSupporter: true,
        supporterSince: m?.supporterSince ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));
  } else {
    await db
      .update(merchants)
      .set({
        isSupporter: false,
        supporterSince: null,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));
  }

  return isSupporter;
}
