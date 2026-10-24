import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { dbMiddleware } from "./lib/db";
import { onError, onNotFound } from "./middleware/errors";
import { requestId, securityHeaders } from "./middleware/request";
import { sessionMiddleware } from "./middleware/session";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import type { AppEnv } from "./types";

/**
 * Resolves the visitor's preferred locale (01-PRD §FR-01.2, 02-TRD §3).
 * Order:
 * 1. NEXT_LOCALE cookie
 * 2. Accept-Language header (matching si, ta, en in that priority)
 * 3. Fallback to "en"
 */
export function resolveLocale(cookie: string | undefined, accept: string | undefined): "en" | "si" | "ta" {
  if (cookie === "en" || cookie === "si" || cookie === "ta") return cookie;
  if (!accept) return "en";
  const lower = accept.toLowerCase();
  if (lower.includes("si")) return "si";
  if (lower.includes("ta")) return "ta";
  return "en";
}

// API sub-app with middleware stack: request ID → headers → db → session.
const api = new Hono<AppEnv>()
  .use(requestId, securityHeaders, dbMiddleware, sessionMiddleware)
  .get("/health", (c) => c.json({ ok: true, data: { status: "ok" } } as const))
  .route("/", authRoutes)
  .route("/", adminRoutes);

// Main worker app: handles root redirect, PostHog reverse proxy, ticket shell rewrite, and /api/* routes.
const app = new Hono<AppEnv>()
  // Locale redirect — the Worker owns GET / (run_worker_first includes "/")
  .get("/", (c) => {
    const cookie = getCookie(c, "NEXT_LOCALE");
    const accept = c.req.header("Accept-Language");
    const locale = resolveLocale(cookie, accept);
    return c.redirect(`/${locale}/`, 307);
  })
  // PostHog reverse proxy (02-TRD §3). Strips cookies to prevent session leakage.
  .all("/ingest/*", async (c) => {
    const url = new URL(c.req.url);
    const upstreamBase = c.env.POSTHOG_HOST || "https://eu.i.posthog.com";
    const targetPath = url.pathname.replace(/^\/ingest/, "") || "/";
    const targetUrl = new URL(targetPath + url.search, upstreamBase);

    const headers = new Headers(c.req.raw.headers);
    headers.delete("cookie");
    headers.set("host", targetUrl.host);

    const init: RequestInit = {
      method: c.req.method,
      headers,
      redirect: "follow",
    };

    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      init.body = c.req.raw.body;
      // @ts-expect-error duplex is required by Node/workerd when streaming request body
      init.duplex = "half";
    }

    const res = await fetch(targetUrl.toString(), init);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  })
  // Feedback ticket shell rewrite (02-TRD §3, 07 §Phase 3).
  // Serves /{locale}/feedback/ticket/ shell for dynamic CB-{number} paths.
  .get("/*/feedback/CB-*", async (c) => {
    if (!c.env.ASSETS) {
      return c.notFound();
    }
    const url = new URL(c.req.url);
    const match = url.pathname.match(/^\/(en|si|ta)\/feedback\/CB-\d+\/?$/);
    if (match) {
      const locale = match[1];
      const rewriteUrl = new URL(`/${locale}/feedback/ticket/`, url.origin);
      return c.env.ASSETS.fetch(new Request(rewriteUrl.toString(), c.req.raw));
    }
    return c.env.ASSETS.fetch(c.req.raw);
  })
  .route("/api", api);

app.onError(onError);
app.notFound(onNotFound);

// Typed client for apps/web (hono/client).
export type AppType = typeof app;

export default app;
