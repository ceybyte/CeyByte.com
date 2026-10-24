import { donations, merchants } from "@cbpos/shared/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../types";

export type SiteStats = {
  districtsCovered: number;
  listedShops: number;
  supporters: number;
};

export const statsRoutes = new Hono<AppEnv>().get("/stats", async (c) => {
  // Check Cache API if available (02-TRD §4, S01 telemetry)
  const cache = typeof caches !== "undefined" && caches.default ? caches.default : null;
  const noCache = c.req.header("cache-control")?.includes("no-cache");
  if (cache && !noCache) {
    try {
      const match = await cache.match(c.req.raw);
      if (match) {
        return new Response(match.body, {
          status: match.status,
          statusText: match.statusText,
          headers: new Headers(match.headers),
        });
      }
    } catch {
      // Ignore cache match errors
    }
  }

  // Check KV cache
  try {
    const kvData = await c.env.CACHE_KV?.get<SiteStats>("stats:v1", "json");
    if (kvData && typeof kvData.districtsCovered === "number") {
      const res = c.json(
        {
          ok: true,
          data: kvData,
        } as const,
        200,
        {
          "Cache-Control": "public, max-age=300",
        },
      );
      if (cache) {
        try {
          c.executionCtx?.waitUntil?.(cache.put(c.req.raw, res.clone()));
        } catch {
          // Ignore background cache put errors
        }
      }
      return res;
    }
  } catch {
    // Fall back to D1 on KV error
  }

  // On miss: query D1 for live stats
  // districtsCovered and listedShops from listed merchants
  const [merchantStats] = await c.var.db
    .select({
      districtsCovered: sql<number>`count(distinct ${merchants.district})`,
      listedShops: sql<number>`count(*)`,
    })
    .from(merchants)
    .where(and(eq(merchants.status, "listed"), isNull(merchants.deletedAt)));

  // supporters from approved donations
  const [donationStats] = await c.var.db
    .select({
      supporters: sql<number>`count(*)`,
    })
    .from(donations)
    .where(eq(donations.status, "approved"));

  const data: SiteStats = {
    districtsCovered: Number(merchantStats?.districtsCovered ?? 0),
    listedShops: Number(merchantStats?.listedShops ?? 0),
    supporters: Number(donationStats?.supporters ?? 0),
  };

  // Write to KV with 300 s TTL
  try {
    await c.env.CACHE_KV?.put("stats:v1", JSON.stringify(data), {
      expirationTtl: 300,
    });
  } catch {
    // Non-fatal if KV put fails
  }

  const res = c.json(
    {
      ok: true,
      data,
    } as const,
    200,
    {
      "Cache-Control": "public, max-age=300",
    },
  );

  if (cache) {
    try {
      c.executionCtx?.waitUntil?.(cache.put(c.req.raw, res.clone()));
    } catch {
      // Non-fatal
    }
  }

  return res;
});
