import { Hono } from "hono";
import type { AppEnv } from "../types";

/**
 * PMTiles Tile Proxy & Cache Route (F-04)
 *
 * Serves map vector tiles with range request support and proper CORS/CORP headers.
 * 1. Serves from R2 bucket cbpos-public (`tiles/<filename>`) when available.
 * 2. Transparently falls back to upstream Protomaps planet build, proxying byte ranges
 *    so MapLibre GL in browsers never hits CORS blocks or missing range errors.
 */
export const tilesRoutes = new Hono<AppEnv>().all("/tiles/:filename", async (c) => {
  const filename = c.req.param("filename");
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return c.text("Invalid tile filename", 400);
  }

  const rangeHeader = c.req.header("range");

  // 1. Try public R2 bucket if bound
  if (c.env.PUBLIC) {
    try {
      const object = await c.env.PUBLIC.get(`tiles/${filename}`, {
        range: c.req.raw.headers,
        onlyIf: c.req.raw.headers,
      });

      if (object && "body" in object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("access-control-allow-origin", "*");
        headers.set("cross-origin-resource-policy", "cross-origin");
        headers.set("access-control-expose-headers", "Content-Length, Content-Range, Accept-Ranges, ETag");
        headers.set("accept-ranges", "bytes");
        headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");

        return new Response(c.req.method === "HEAD" ? null : object.body, {
          status: rangeHeader ? 206 : 200,
          headers,
        });
      }
    } catch (err) {
      console.warn("[tiles] R2 read error, falling back to upstream:", err);
    }
  }

  // 2. Fallback: Proxy upstream Protomaps build
  const upstreamUrl = "https://build.protomaps.com/20261024.pmtiles";
  const upstreamHeaders = new Headers();
  if (rangeHeader) {
    upstreamHeaders.set("range", rangeHeader);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: c.req.method,
      headers: upstreamHeaders,
    });

    const resHeaders = new Headers();
    const headersToCopy = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ];

    for (const h of headersToCopy) {
      const val = upstream.headers.get(h);
      if (val) resHeaders.set(h, val);
    }

    resHeaders.set("access-control-allow-origin", "*");
    resHeaders.set("cross-origin-resource-policy", "cross-origin");
    resHeaders.set("access-control-expose-headers", "Content-Length, Content-Range, Accept-Ranges, ETag");
    resHeaders.set("accept-ranges", "bytes");
    resHeaders.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");

    return new Response(c.req.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[tiles] Upstream proxy error:", err);
    return c.text("Tiles proxy unavailable", 502);
  }
});
