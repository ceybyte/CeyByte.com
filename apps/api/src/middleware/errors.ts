import type { ApiResult } from "@cbpos/shared/errors";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ApiError } from "../lib/errors";
import { log } from "../lib/log";
import type { AppEnv } from "../types";

// Every failure leaves the Worker as the ApiResult envelope (02-TRD §5.3). Unknown errors are logged with the
// request ID and reported as INTERNAL; their message never reaches the client.
export function onError(err: Error, c: Context<AppEnv>) {
  const requestId = c.get("requestId") ?? crypto.randomUUID();
  if (err instanceof ApiError) {
    if (err.options.retryAfter) c.header("retry-after", String(err.options.retryAfter));
    const body: ApiResult<never> = {
      ok: false,
      error: { code: err.code, requestId, ...(err.options.fields && { fields: err.options.fields }) },
    };
    return c.json(body, err.status);
  }
  if (err instanceof HTTPException && err.status < 500) {
    const code =
      err.status === 404 ? "NOT_FOUND" : err.status === 401 ? "UNAUTHENTICATED" : "VALIDATION_FAILED";
    return onError(new ApiError(code), c);
  }
  log.error("unhandled", { requestId, route: c.req.routePath, error: err });
  return c.json({ ok: false, error: { code: "INTERNAL", requestId } } satisfies ApiResult<never>, 500);
}

export function onNotFound(c: Context<AppEnv>) {
  return onError(new ApiError("NOT_FOUND"), c);
}
