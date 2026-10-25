import { Hono } from "hono";
import { z } from "zod";
import { ApiError } from "../lib/errors";
import { rateLimit } from "../lib/ratelimit";
import { log } from "../lib/log";
import type { AppEnv } from "../types";

const docsFeedbackSchema = z.object({
  articleSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  locale: z.enum(["en", "si", "ta"]),
  helpful: z.boolean(),
  reason: z.string().max(500).optional(),
});

export const docsFeedbackRoutes = new Hono<AppEnv>().post(
  "/docs/feedback",
  rateLimit("RL_VOTES"),
  async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = docsFeedbackSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_FAILED");
    }

    const { articleSlug, categorySlug, locale, helpful, reason } = parsed.data;

    log.info("docs_feedback_received", {
      articleSlug,
      categorySlug,
      locale,
      helpful,
      hasReason: Boolean(reason),
    });

    return c.json({
      ok: true,
      data: { received: true },
    } as const);
  },
);
