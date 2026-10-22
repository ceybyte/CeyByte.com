import { createMiddleware } from "hono/factory";
import { createAuth } from "../lib/auth";
import { ApiError } from "../lib/errors";
import type { AppEnv } from "../types";

// Looks up the session only when a session cookie is present, so anonymous public reads cost no D1 query.
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const cookie = c.req.header("cookie") ?? "";
  if (!cookie.includes("better-auth.session_token")) {
    c.set("session", null);
    return next();
  }
  const auth = createAuth(c.env, c.get("db"));
  c.set("session", await auth.api.getSession({ headers: c.req.raw.headers }));
  await next();
});

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("session")) throw new ApiError("UNAUTHENTICATED");
  await next();
});

// Admin routes answer 404 to everyone else, signed in or not, so they can't be discovered (02-TRD §5.2).
export const requireRole = (role: "admin") =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (c.get("session")?.user.role !== role) throw new ApiError("NOT_FOUND");
    await next();
  });
