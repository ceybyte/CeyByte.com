import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { DownloadGateSchema } from "@cbpos/shared/schemas/download-gate";
import { sha256Hex, toHex } from "../lib/crypto";
import { ApiError } from "../lib/errors";
import { bumpGeoVersion } from "../lib/geo-cache";
import { clientIp, ipHash } from "../lib/iphash";
import { log } from "../lib/log";
import { rateLimit } from "../lib/ratelimit";
import { turnstile } from "../lib/turnstile";
import type { AppEnv } from "../types";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function generatePublicId(prefix = "m_"): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let res = prefix;
  for (let i = 0; i < 6; i++) {
    const byte = bytes[i] ?? 0;
    res += BASE58_ALPHABET[byte % BASE58_ALPHABET.length];
  }
  return res;
}

function generateClaimToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer as ArrayBuffer);
}

export const downloadsRoutes = new Hono<AppEnv>()
  /**
   * POST /api/downloads (01-PRD §F-03, 02-TRD §5.1)
   * Frictionless Download Gate: Turnstile → RL_FORMS → validation → merchant upsert → cookies → redirect URL.
   */
  .post("/downloads", turnstile("gate"), rateLimit("RL_FORMS", { perHour: 10 }), async (c) => {
    let rawBody: unknown;
    const contentType = c.req.header("content-type") ?? "";
    if (contentType.includes("json")) {
      rawBody = await c.req.json().catch(() => null);
    } else {
      rawBody = await c.req.parseBody().catch(() => null);
    }

    if (!rawBody || typeof rawBody !== "object") {
      throw new ApiError("VALIDATION_FAILED");
    }

    // Convert booleans / numbers from form submissions if needed
    const normalizedInput: Record<string, unknown> = { ...(rawBody as Record<string, unknown>) };
    if (typeof normalizedInput.lat === "string") normalizedInput.lat = Number(normalizedInput.lat);
    if (typeof normalizedInput.lng === "string") normalizedInput.lng = Number(normalizedInput.lng);
    if (
      normalizedInput.isPublicOnMap === "true" ||
      normalizedInput.isPublicOnMap === "1" ||
      normalizedInput.isPublicOnMap === true
    ) {
      normalizedInput.isPublicOnMap = true;
    } else {
      normalizedInput.isPublicOnMap = false;
    }
    if (
      normalizedInput.termsAccepted === "true" ||
      normalizedInput.termsAccepted === "1" ||
      normalizedInput.termsAccepted === true
    ) {
      normalizedInput.termsAccepted = true;
    }

    const parse = DownloadGateSchema.safeParse(normalizedInput);
    if (!parse.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parse.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      throw new ApiError("VALIDATION_FAILED", { fields: fieldErrors });
    }

    const data = parse.data;
    const now = Date.now();
    const db = c.var.db;

    // Check for existing active merchant with the same phone (deduplication per FR-03.3)
    const existing = await c.env.DB.prepare(
      "SELECT id, public_id, status, is_public_on_map FROM merchants WHERE phone = ? AND deleted_at IS NULL LIMIT 1",
    )
      .bind(data.phone)
      .first<{ id: string; public_id: string; status: string; is_public_on_map: number }>();

    let merchantId: string;
    let publicId: string;
    const claimToken = generateClaimToken();
    const claimTokenHash = await sha256Hex(claimToken);
    let shouldBumpGeo = false;

    if (existing) {
      merchantId = existing.id;
      publicId = existing.public_id;

      // Update merchant details while preserving status unless becoming public
      const newIsPublic = data.isPublicOnMap ? 1 : existing.is_public_on_map;
      const newStatus = newIsPublic ? "listed" : existing.status;

      await c.env.DB.prepare(
        `UPDATE merchants SET
          full_name = ?,
          shop_name = ?,
          category = ?,
          whatsapp = ?,
          district = ?,
          city = ?,
          lat = ?,
          lng = ?,
          location_source = ?,
          is_public_on_map = ?,
          status = ?,
          terms_version = ?,
          terms_accepted_at = ?,
          preferred_locale = ?,
          updated_at = ?
        WHERE id = ?`,
      )
        .bind(
          data.fullName,
          data.shopName,
          data.category,
          data.whatsapp ?? null,
          data.district,
          data.city,
          data.lat,
          data.lng,
          data.locationSource,
          newIsPublic,
          newStatus,
          data.termsVersion,
          now,
          data.preferredLocale,
          now,
          merchantId,
        )
        .run();

      if (data.isPublicOnMap && !existing.is_public_on_map) {
        shouldBumpGeo = true;
      }
    } else {
      merchantId = `m_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      publicId = generatePublicId("m_");
      const status = data.isPublicOnMap ? "listed" : "hidden";

      await c.env.DB.prepare(
        `INSERT INTO merchants (
          id, public_id, full_name, phone, whatsapp, shop_name, category,
          district, city, lat, lng, location_source, is_public_on_map, status,
          terms_version, terms_accepted_at, claim_token_hash, preferred_locale,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          merchantId,
          publicId,
          data.fullName,
          data.phone,
          data.whatsapp ?? null,
          data.shopName,
          data.category,
          data.district,
          data.city,
          data.lat,
          data.lng,
          data.locationSource,
          data.isPublicOnMap ? 1 : 0,
          status,
          data.termsVersion,
          now,
          claimTokenHash,
          data.preferredLocale,
          now,
          now,
        )
        .run();

      if (data.isPublicOnMap) {
        shouldBumpGeo = true;
      }
    }

    // Asynchronously insert merchant log & update geo cache if public
    const ip = clientIp(c.req.raw.headers);
    const hashedIp = await ipHash(c.env, ip);
    const rawCf = c.req.raw as unknown as { cf?: { country?: string } };
    const country = rawCf.cf?.country ?? null;

    c.executionCtx.waitUntil(
      (async () => {
        try {
          await c.env.DB.prepare(
            `INSERT INTO merchant_logs (id, merchant_id, event, meta, ip_hash, country, created_at)
             VALUES (?, ?, 'download_gate_submitted', ?, ?, ?, ?)`,
          )
            .bind(
              `ml_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
              merchantId,
              JSON.stringify({
                category: data.category,
                district: data.district,
                isPublicOnMap: data.isPublicOnMap,
                preferredLocale: data.preferredLocale,
              }),
              hashedIp,
              country,
              now,
            )
            .run();

          if (shouldBumpGeo) {
            await bumpGeoVersion(c.env.CACHE_KV, db);
          }
        } catch (e) {
          log.warn("download_gate_async_log_failed", { error: e });
        }
      })(),
    );

    // Set 180-day cookies per 01-PRD §FR-03.2
    const isHttps = c.req.url.startsWith("https://") || c.env.ENVIRONMENT === "production";
    setCookie(c, "cb_gate", publicId, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "Lax",
      maxAge: 180 * 86400,
      path: "/",
    });
    setCookie(c, "cb_gate_done", "1", {
      httpOnly: false,
      secure: isHttps,
      sameSite: "Lax",
      maxAge: 180 * 86400,
      path: "/",
    });

    // Resolve release metadata for response
    const release = (await c.env.CACHE_KV.get("release:latest", "json")) ?? null;

    const downloadUrl = `/api/download/latest?ref=${publicId}`;

    // No-JS form support: redirect with 303 if client is standard HTML form post
    if (contentType.includes("form") && !c.req.header("accept")?.includes("application/json")) {
      return c.redirect(`/${data.preferredLocale}/download?done=1&ref=${publicId}`, 303);
    }

    return c.json({
      ok: true,
      data: {
        downloadUrl,
        claimToken,
        release,
      },
    } as const);
  });
