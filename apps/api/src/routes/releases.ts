import { Hono } from "hono";
import { FALLBACK_RELEASE } from "../lib/fallback-release";
import { clientIp, ipHash } from "../lib/iphash";
import { log } from "../lib/log";
import type { AppEnv } from "../types";

export const releasesRoutes = new Hono<AppEnv>()
  /**
   * GET /api/releases/latest (01-PRD §FR-06.5, 02-TRD §5.1)
   * Resolves latest stable release from Cache API → KV → D1 → FALLBACK_RELEASE.
   */
  .get("/releases/latest", async (c) => {
    const cache = "caches" in globalThis ? await caches.default : null;
    if (cache && c.req.header("cache-control") !== "no-cache") {
      const match = await cache.match(c.req.raw);
      if (match) {
        return new Response(match.body, {
          status: match.status,
          statusText: match.statusText,
          headers: new Headers(match.headers),
        });
      }
    }

    // Try KV first (0-D1-query optimization)
    let release = await c.env.CACHE_KV.get("release:latest", "json");

    // Fallback to D1 on KV miss
    if (!release) {
      const d1Row = await c.env.DB.prepare(
        `SELECT id, version, channel, release_date, exe_url as download_url,
                notes_md as changelog, min_version, exe_sha256 as sha256,
                exe_size as size, published_at, is_latest
         FROM releases
         WHERE channel = 'stable' AND is_latest = 1 AND is_yanked = 0
         LIMIT 1`,
      ).first();

      if (d1Row) {
        release = d1Row;
        await c.env.CACHE_KV.put("release:latest", JSON.stringify(release), {
          expirationTtl: 300,
        });
      }
    }

    // Fallback constant embedded in Worker bundle
    if (!release) {
      release = FALLBACK_RELEASE;
    }

    const response = c.json(
      {
        ok: true,
        data: release,
      } as const,
      200,
      {
        "Cache-Control": "public, max-age=300",
      },
    );

    if (cache) {
      try {
        c.executionCtx.waitUntil(cache.put(c.req.raw, response.clone()));
      } catch (err) {
        log.warn("cache_put_failed", { err });
      }
    }

    return response;
  })

  /**
   * GET /api/download/latest (02-TRD §7.3)
   * Streams 302 to the GitHub Releases asset.
   * Asynchronously logs installer_download_started event.
   */
  .get("/download/latest", async (c) => {
    const ref = c.req.query("ref");

    // Resolve latest release info
    let release = (await c.env.CACHE_KV.get("release:latest", "json")) as {
      id?: string;
      download_url?: string;
    } | null;

    if (!release?.download_url) {
      const d1Row = await c.env.DB.prepare(
        "SELECT id, exe_url as download_url FROM releases WHERE channel = 'stable' AND is_latest = 1 AND is_yanked = 0 LIMIT 1",
      ).first<{ id: string; download_url: string }>();

      if (d1Row?.download_url) {
        release = d1Row;
      }
    }

    const downloadUrl = release?.download_url || FALLBACK_RELEASE.download_url;
    const releaseId = release?.id || FALLBACK_RELEASE.id;

    // Asynchronously log the download event (02-TRD §7.3 step 2)
    c.executionCtx.waitUntil(
      (async () => {
        try {
          let merchantId: string | null = null;
          if (ref) {
            const m = await c.env.DB.prepare(
              "SELECT id FROM merchants WHERE public_id = ? AND deleted_at IS NULL",
            )
              .bind(ref)
              .first<{ id: string }>();
            if (m) merchantId = m.id;
          }

          const ip = clientIp(c.req.raw.headers);
          const hashed = await ipHash(c.env, ip);
          const rawCf = c.req.raw as unknown as { cf?: { country?: string } };
          const country = rawCf.cf?.country ?? null;

          await c.env.DB.prepare(
            `INSERT INTO merchant_logs (id, merchant_id, release_id, event, ip_hash, country, created_at)
             VALUES (?, ?, ?, 'installer_download_started', ?, ?, ?)`,
          )
            .bind(
              `ml_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
              merchantId,
              releaseId,
              hashed,
              country,
              Date.now(),
            )
            .run();
        } catch (e) {
          log.warn("download_log_failed", { error: e });
        }
      })(),
    );

    return c.redirect(downloadUrl, 302);
  });
