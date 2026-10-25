import { Hono } from "hono";
import { getGeoSnapshot, readVersion } from "../lib/geo-cache";
import { rateLimit } from "../lib/ratelimit";
import type { AppEnv } from "../types";

export const merchantsRoutes = new Hono<AppEnv>().get("/merchants/geo", rateLimit("RL_READ"), async (c) => {
  const { n } = await readVersion(c.env.CACHE_KV);
  const etag = `W/"geo-${n}"`;
  const clientEtag = c.req.header("if-none-match");

  const cacheHeaders: Record<string, string> = {
    "Content-Type": "application/geo+json; charset=utf-8",
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
    ETag: etag,
  };

  // Fast 304 check (TRD §10)
  if (clientEtag && clientEtag === etag) {
    return new Response(null, {
      status: 304,
      headers: cacheHeaders,
    });
  }

  // Check Cloudflare Cache API if available
  const cache = typeof caches !== "undefined" && caches.default ? caches.default : null;
  const internalCacheUrl = `https://cache.internal/geo/v${n}`;
  const cacheKey = new Request(internalCacheUrl);

  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return new Response(cached.body, {
          status: 200,
          headers: new Headers(cached.headers),
        });
      }
    } catch {
      // Fall back to KV/D1 on cache match error
    }
  }

  // Retrieve snapshot from KV (falling back to D1 with PUBLIC_GEO_COLUMNS)
  const snapshot = await getGeoSnapshot(c.env.CACHE_KV, c.var.db);
  const body = JSON.stringify(snapshot);

  const response = new Response(body, {
    status: 200,
    headers: cacheHeaders,
  });

  if (cache) {
    try {
      c.executionCtx?.waitUntil?.(cache.put(cacheKey, response.clone()));
    } catch {
      // Ignore background cache store error
    }
  }

  return response;
});
