import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { createAuth, localeFromCookie } from "../lib/auth";
import { clientIp, ipHash } from "../lib/iphash";
import { rateLimit } from "../lib/ratelimit";
import type { AppEnv } from "../types";

// Better Auth at /api/auth/* (02-TRD §5.1). RL_AUTH guards the calls that send email or create sessions.
const limitPosts = createMiddleware<AppEnv>((c, next) =>
  c.req.method === "POST" ? rateLimit("RL_AUTH")(c, next) : next(),
);

export const authRoutes = new Hono<AppEnv>()
  .use("/auth/sign-in/*", limitPosts)
  .use("/auth/email-otp/*", limitPosts)
  .on(["GET", "POST"], "/auth/*", async (c) => {
    const headers = c.req.raw.headers;
    const auth = createAuth(c.env, c.get("db"), {
      ipHash: await ipHash(c.env, clientIp(headers)),
      locale: localeFromCookie(headers.get("cookie")),
      cookieHeader: headers.get("cookie"),
    });
    return auth.handler(c.req.raw);
  });
