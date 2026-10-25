import { Hono } from "hono";
import { ApiError } from "../lib/errors";
import { verifyWebhookSignature } from "../lib/github";
import { log } from "../lib/log";
import { triggerRebuild } from "../lib/rebuild";
import { syncReleases } from "../lib/releases-sync";
import type { AppEnv } from "../types";

export const webhooksRoutes = new Hono<AppEnv>()
  /**
   * POST /api/webhooks/github (02-TRD §7.2, §12.4)
   * Receives GitHub release webhooks, verifies HMAC signature, and triggers sync.
   */
  .post("/webhooks/github", async (c) => {
    const rawBody = await c.req.raw.arrayBuffer();
    const signature = c.req.header("x-hub-signature-256") ?? null;
    const secret = c.env.GITHUB_WEBHOOK_SECRET;

    if (!secret || !(await verifyWebhookSignature(secret, rawBody, signature))) {
      throw new ApiError("SIGNATURE_INVALID");
    }

    const event = c.req.header("x-github-event");
    if (event !== "release") {
      return c.json({ ok: true, data: { status: "ignored" } } as const, 202);
    }

    let payload: { action?: string; release?: { tag_name?: string } };
    try {
      payload = JSON.parse(new TextDecoder().decode(rawBody));
    } catch {
      throw new ApiError("VALIDATION_FAILED");
    }

    const action = payload.action;
    const tag = payload.release?.tag_name ?? "";
    const version = tag.replace(/^v/, "");

    log.info("github_webhook_received", { event, action, version });

    if (action === "published" || action === "edited") {
      c.executionCtx.waitUntil(syncReleases(c.env, "webhook"));
    } else if (action === "deleted" && version) {
      c.executionCtx.waitUntil(
        (async () => {
          try {
            await c.env.DB.prepare(
              "UPDATE releases SET is_yanked = 1, is_latest = 0, updated_at = ? WHERE version = ?",
            )
              .bind(Date.now(), version)
              .run();

            // Recompute latest release
            const nextLatest = await c.env.DB.prepare(
              `SELECT id, version, channel, release_date, exe_url as download_url,
                      notes_md as changelog, min_version, exe_sha256 as sha256,
                      exe_size as size, published_at, is_latest
               FROM releases
               WHERE channel = 'stable' AND is_yanked = 0
               ORDER BY published_at DESC
               LIMIT 1`,
            ).first();

            if (nextLatest) {
              await c.env.DB.prepare("UPDATE releases SET is_latest = 1 WHERE id = ?")
                .bind(nextLatest.id)
                .run();
              await c.env.CACHE_KV.put("release:latest", JSON.stringify(nextLatest));
            } else {
              await c.env.CACHE_KV.delete("release:latest");
            }

            await triggerRebuild(c.env, `release_deleted_${version}`);
          } catch (e) {
            log.warn("release_delete_handler_failed", { error: e });
          }
        })(),
      );
    }

    return c.json({ ok: true, data: { status: "accepted" } } as const, 202);
  });
