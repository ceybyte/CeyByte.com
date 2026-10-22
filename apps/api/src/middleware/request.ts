import { createMiddleware } from "hono/factory";
import { secureHeaders } from "hono/secure-headers";
import type { AppEnv } from "../types";

// requestId = cf-ray (02-TRD §13), echoed in every error envelope so a user's report can be matched to a log.
export const requestId = createMiddleware<AppEnv>(async (c, next) => {
  const id = c.req.header("cf-ray") ?? crypto.randomUUID();
  c.set("requestId", id);
  await next();
  c.header("x-request-id", id);
});

// The static site gets its headers from _headers (02-TRD §12.3); these cover the Worker's own responses,
// which are JSON or redirects, so the CSP can deny everything.
export const securityHeaders = secureHeaders({
  contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"] },
  strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
  referrerPolicy: "strict-origin-when-cross-origin",
  xFrameOptions: "DENY",
  crossOriginOpenerPolicy: "same-origin",
  crossOriginResourcePolicy: "same-origin",
  permissionsPolicy: { camera: [], microphone: [], payment: [], geolocation: [] },
});
