import { Hono } from "hono";

// Bindings come from `wrangler types` (worker-configuration.d.ts → Env).
const app = new Hono<{ Bindings: Env }>()
  .basePath("/api")
  .get("/health", (c) => c.json({ ok: true, data: { status: "ok" } } as const));

// Typed client for apps/web (hono/client).
export type AppType = typeof app;

export default app;
