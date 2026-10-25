import { Hono } from "hono";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { rateLimit } from "../lib/ratelimit";
import { turnstile } from "../lib/turnstile";
import { checkDeclaredFile, presignPut, verifyUpload, UPLOAD_PURPOSES } from "../lib/r2";
import type { AppEnv } from "../types";

const presignSchema = z.object({
  purpose: z.enum(UPLOAD_PURPOSES),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  size: z.number().int().positive(),
  entityRef: z.string().min(1).max(64),
  turnstileToken: z.string().optional(),
});

const confirmSchema = z.object({
  key: z.string().min(1).max(512),
  purpose: z.enum(UPLOAD_PURPOSES),
  entityRef: z.string().min(1).max(64),
});

export const uploadsRoutes = new Hono<AppEnv>()
  .post("/uploads/presign", turnstile("upload"), rateLimit("RL_UPLOADS"), async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = presignSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_FAILED");
    }

    const { purpose, fileName, contentType, size, entityRef } = parsed.data;
    const ext = checkDeclaredFile(purpose, fileName, contentType, size);

    let prefix = "slips";
    if (purpose === "crash_log") prefix = "crash-logs";
    else if (purpose === "ticket_screenshot") prefix = "screenshots";

    const fileUuid = crypto.randomUUID();
    const key = `${prefix}/${entityRef}/${fileUuid}.${ext}`;
    const expiresSec = 300;
    const uploadUrl = await presignPut(c.env, key, contentType, expiresSec);

    return c.json({
      ok: true,
      data: {
        uploadUrl,
        key,
        expiresAt: Date.now() + expiresSec * 1000,
      },
    } as const);
  })
  .post("/uploads/confirm", async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = confirmSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_FAILED");
    }

    const { key, purpose } = parsed.data;
    if (!c.env.UPLOADS) {
      throw new ApiError("ENV_MISCONFIGURED");
    }

    const verified = await verifyUpload(c.env.UPLOADS, key, purpose);
    return c.json({
      ok: true,
      data: verified,
    } as const);
  });
