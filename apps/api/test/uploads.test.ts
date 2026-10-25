import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";

const call = (
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
) => {
  return exports.default.fetch(`${ORIGIN}${path}`, {
    method: options.method ?? "GET",
    headers: options.headers,
    body: options.body,
    redirect: "manual",
  });
};

describe("Uploads Presigning API (POST /api/uploads/presign)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
        return new Response(JSON.stringify({ success: true }));
      }
      return originalFetch(input, init);
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("rejects file exceeding max size (5 MB)", async () => {
    const res = await call("/api/uploads/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        purpose: "crash_log",
        fileName: "cbpos_logs.txt",
        contentType: "text/plain",
        size: 6 * 1024 * 1024, // 6 MB > 5 MB
        entityRef: "draft-1234",
        turnstileToken: "valid-token",
      }),
    });

    expect(res.status).toBe(413);
    const body = (await res.json()) as { ok: boolean; error: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("rejects disallowed file extensions or MIME types", async () => {
    const res = await call("/api/uploads/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        purpose: "crash_log",
        fileName: "malware.exe",
        contentType: "application/x-msdownload",
        size: 1024,
        entityRef: "draft-1234",
        turnstileToken: "valid-token",
      }),
    });

    expect(res.status).toBe(415);
    const body = (await res.json()) as { ok: boolean; error: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("FILE_TYPE_NOT_ALLOWED");
  });

  it("generates presigned upload URL for valid crash_log", async () => {
    const res = await call("/api/uploads/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        purpose: "crash_log",
        fileName: "cbpos_logs.txt",
        contentType: "text/plain",
        size: 1024,
        entityRef: "draft-1234",
        turnstileToken: "valid-token",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { uploadUrl: string; key: string; expiresAt: number };
    };
    expect(body.ok).toBe(true);
    expect(body.data.uploadUrl).toBeDefined();
    expect(body.data.key).toContain("crash-logs/draft-1234/");
    expect(body.data.key.endsWith(".txt")).toBe(true);
  });

  it("generates presigned upload URL for valid ticket_screenshot", async () => {
    const res = await call("/api/uploads/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        purpose: "ticket_screenshot",
        fileName: "receipt-issue.png",
        contentType: "image/png",
        size: 50000,
        entityRef: "draft-5678",
        turnstileToken: "valid-token",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { uploadUrl: string; key: string; expiresAt: number };
    };
    expect(body.ok).toBe(true);
    expect(body.data.uploadUrl).toBeDefined();
    expect(body.data.key).toContain("screenshots/draft-5678/");
    expect(body.data.key.endsWith(".png")).toBe(true);
  });
});
