import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";
import { ApiError } from "./errors";
import { clientIp, ipHash } from "./iphash";

// 02-TRD §11. Second guard after Turnstile. The key is the session user, else the daily IP hash.
// Rate-limit bindings only allow 10 s or 60 s periods, so the hourly window is a KV counter.

type RateLimitBinding = "RL_FORMS" | "RL_UPLOADS" | "RL_VOTES" | "RL_AUTH" | "RL_READ";

export async function rateLimitKey(c: {
  env: Env;
  req: { raw: Request };
  get: (k: "session") => AppEnv["Variables"]["session"];
}) {
  const userId = c.get("session")?.user.id;
  return userId ? `u:${userId}` : `a:${await ipHash(c.env, clientIp(c.req.raw.headers))}`;
}

export const rateLimit = (binding: RateLimitBinding, opts: { perHour?: number } = {}) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const key = await rateLimitKey(c);
    const { success } = await c.env[binding].limit({ key });
    if (!success) throw new ApiError("RATE_LIMITED", { retryAfter: 60 });

    if (opts.perHour) {
      const hour = Math.floor(Date.now() / 3_600_000);
      const kvKey = `rl:${binding}:${key}:${hour}`;
      const count = Number((await c.env.CACHE_KV.get(kvKey)) ?? 0);
      if (count >= opts.perHour) {
        const retryAfter = Math.max(1, (hour + 1) * 3600 - Math.floor(Date.now() / 1000));
        throw new ApiError("RATE_LIMITED", { retryAfter });
      }
      // One KV write per accepted form submission; forms are rare (02-TRD §14 KV budget).
      c.executionCtx.waitUntil(c.env.CACHE_KV.put(kvKey, String(count + 1), { expirationTtl: 3600 }));
    }
    await next();
  });
