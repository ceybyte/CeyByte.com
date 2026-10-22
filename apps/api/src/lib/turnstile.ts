import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";
import { ApiError } from "./errors";
import { clientIp } from "./iphash";
import { log } from "./log";

// 02-TRD §12.1. First guard on every public mutating endpoint (CLAUDE.md §1.8).

export type TurnstileAction = "gate" | "feedback" | "donation" | "upload";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ALLOWED_HOSTNAMES = new Set(["ceybyte.com", "localhost"]);

type SiteverifyResult = { success: boolean; hostname?: string; action?: string; "error-codes"?: string[] };

export async function verifyTurnstile(
  env: Pick<Env, "TURNSTILE_SECRET_KEY" | "ENVIRONMENT">,
  token: string,
  action: TurnstileAction,
  ip: string,
): Promise<boolean> {
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  body.set("remoteip", ip);
  body.set("idempotency_key", crypto.randomUUID());
  const res = await fetch(SITEVERIFY, { method: "POST", body });
  if (!res.ok) return false;
  const result: SiteverifyResult = await res.json();
  if (!result.success) {
    log.warn("turnstile_rejected", { action, codes: result["error-codes"] });
    return false;
  }
  // Cloudflare's test keys answer with a placeholder hostname and no action, so only production checks them.
  if (env.ENVIRONMENT !== "production") return true;
  return ALLOWED_HOSTNAMES.has(result.hostname ?? "") && result.action === action;
}

/** Reads the token from `X-Turnstile-Token`, a JSON `turnstileToken`, or the widget's form field. */
async function readToken(req: Request, parsed: () => Promise<unknown>): Promise<string> {
  const header = req.headers.get("x-turnstile-token");
  if (header) return header;
  const type = req.headers.get("content-type") ?? "";
  if (!type.includes("json") && !type.includes("form")) return "";
  const body = await parsed().catch(() => null);
  if (!body || typeof body !== "object") return "";
  const value =
    (body as Record<string, unknown>).turnstileToken ??
    (body as Record<string, unknown>)["cf-turnstile-response"];
  return typeof value === "string" ? value : "";
}

export const turnstile = (action: TurnstileAction) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const token = await readToken(c.req.raw, () =>
      (c.req.header("content-type") ?? "").includes("json") ? c.req.json() : c.req.parseBody(),
    );
    if (!token || token.length > 2048) throw new ApiError("TURNSTILE_FAILED");
    if (!(await verifyTurnstile(c.env, token, action, clientIp(c.req.raw.headers)))) {
      throw new ApiError("TURNSTILE_FAILED");
    }
    await next();
  });
