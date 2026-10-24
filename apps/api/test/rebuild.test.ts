import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";
const IP = "203.0.113.8";

const call = (path: string, init: RequestInit & { cookie?: string } = {}) => {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);
  headers.set("cf-connecting-ip", IP);
  if (init.body) headers.set("content-type", "application/json");
  if (init.cookie) headers.set("cookie", init.cookie);
  return exports.default.fetch(`${ORIGIN}/api${path}`, { ...init, headers });
};

async function signIn(email: string): Promise<string> {
  const sent = await call("/auth/email-otp/send-verification-otp", {
    method: "POST",
    body: JSON.stringify({ email, type: "sign-in" }),
  });
  expect(sent.status).toBe(200);

  const row = await env.DB.prepare(
    "SELECT value FROM verifications WHERE identifier LIKE ? ORDER BY created_at DESC",
  )
    .bind(`%${email}`)
    .first<{ value: string }>();
  const otp = row?.value.split(":")[0];

  const res = await call("/auth/sign-in/email-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  expect(res.status).toBe(200);
  const cookie = res.headers.getSetCookie().find((c) => c.includes("better-auth.session_token"));
  if (!cookie) throw new Error("no session cookie");
  return cookie.split(";")[0] ?? "";
}

describe("Rebuild endpoints (/api/admin/rebuild)", () => {
  it("rejects unauthenticated requests with 404", async () => {
    const postRes = await call("/admin/rebuild", { method: "POST" });
    expect(postRes.status).toBe(404);

    const getRes = await call("/admin/rebuild/status");
    expect(getRes.status).toBe(404);
  });

  it("rejects non-admin merchant requests with 404", async () => {
    const cookie = await signIn("rebuild-merchant@example.com");

    const postRes = await call("/admin/rebuild", { method: "POST", cookie });
    expect(postRes.status).toBe(404);

    const getRes = await call("/admin/rebuild/status", { cookie });
    expect(getRes.status).toBe(404);
  });

  it("triggers rebuild in mock mode when GITHUB_DISPATCH_TOKEN is unset in test", async () => {
    const cookie = await signIn("rebuild-admin@example.com");
    await env.DB.prepare("UPDATE users SET role = 'admin' WHERE email = ?")
      .bind("rebuild-admin@example.com")
      .run();

    const res = await call("/admin/rebuild", {
      method: "POST",
      cookie,
      body: JSON.stringify({ reason: "manual_test" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { mode: string; triggered: boolean };
    };
    expect(body.ok).toBe(true);
    expect(body.data.mode).toBe("mock");
    expect(body.data.triggered).toBe(false);
  });

  it("fetches rebuild status in mock mode when GITHUB_DISPATCH_TOKEN is unset in test", async () => {
    const cookie = await signIn("rebuild-status-admin@example.com");
    await env.DB.prepare("UPDATE users SET role = 'admin' WHERE email = ?")
      .bind("rebuild-status-admin@example.com")
      .run();

    const res = await call("/admin/rebuild/status", { cookie });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { status: string; conclusion: string; mode: string };
    };
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("completed");
    expect(body.data.conclusion).toBe("success");
    expect(body.data.mode).toBe("mock");
  });
});
