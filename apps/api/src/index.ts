import { Hono } from "hono";
import { dbMiddleware } from "./lib/db";
import { onError, onNotFound } from "./middleware/errors";
import { requestId, securityHeaders } from "./middleware/request";
import { sessionMiddleware } from "./middleware/session";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import type { AppEnv } from "./types";

// Bindings come from `wrangler types` (worker-configuration.d.ts → Env). Order: request ID → headers → db →
// session, then routes. Public mutating routes add turnstile() → rateLimit() → validate() (CLAUDE.md §1.8).
const app = new Hono<AppEnv>()
  .basePath("/api")
  .use(requestId, securityHeaders, dbMiddleware, sessionMiddleware)
  .get("/health", (c) => c.json({ ok: true, data: { status: "ok" } } as const))
  .route("/", authRoutes)
  .route("/", adminRoutes);

app.onError(onError);
app.notFound(onNotFound);

// Typed client for apps/web (hono/client).
export type AppType = typeof app;

export default app;
