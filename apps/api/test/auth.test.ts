import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

// Phase 2 verify (07 plan): OTP sign-in works, sessions never hold a raw IP, and only admins see /api/admin.

const ORIGIN = "http://localhost:3000";
const IP = "203.0.113.7";

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
  expect(otp).toMatch(/^\d{6}$/);

  const res = await call("/auth/sign-in/email-otp", { method: "POST", body: JSON.stringify({ email, otp }) });
  expect(res.status).toBe(200);
  const cookie = res.headers.getSetCookie().find((c) => c.includes("better-auth.session_token"));
  if (!cookie) throw new Error("no session cookie");
  return cookie.split(";")[0] ?? "";
}

describe("auth", () => {
  it("signs in with an emailed code and returns the session", async () => {
    const cookie = await signIn("shop@example.com");
    const res = await call("/auth/get-session", { cookie });
    const body: { user: { email: string; role: string } } = await res.json();
    expect(body.user.email).toBe("shop@example.com");
    expect(body.user.role).toBe("merchant");
  });

  it("stores a daily IP hash on the session, never the raw IP or user agent", async () => {
    await signIn("hash@example.com");
    const row = await env.DB.prepare(
      "SELECT s.ip_address AS ip, s.user_agent AS ua FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email = ?",
    )
      .bind("hash@example.com")
      .first<{ ip: string; ua: string | null }>();
    expect(row?.ip).toMatch(/^[a-f0-9]{64}$/);
    expect(row?.ip).not.toContain(IP);
    expect(row?.ua).toBeNull();
  });

  it("has no password sign-in", async () => {
    const res = await call("/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: "x@example.com", password: "hunter22hunter22" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("admin routes", () => {
  it("answer 404 to anonymous visitors", async () => {
    const res = await call("/admin/overview");
    expect(res.status).toBe(404);
    const body: { ok: boolean; error: { code: string; requestId: string } } = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.requestId).toBeTruthy();
  });

  it("answer 404 to a signed-in merchant", async () => {
    const cookie = await signIn("merchant@example.com");
    expect((await call("/admin/overview", { cookie })).status).toBe(404);
  });

  it("answer an admin", async () => {
    const cookie = await signIn("admin@example.com");
    await env.DB.prepare("UPDATE users SET role = 'admin' WHERE email = ?").bind("admin@example.com").run();
    const res = await call("/admin/overview", { cookie });
    expect(await res.json()).toEqual({
      ok: true,
      data: expect.objectContaining({ merchants: 0, pendingSlips: 0, openTickets: 0, districtsCovered: 0 }),
    });
  });
});

describe("envelope", () => {
  it("wraps unknown routes as NOT_FOUND with security headers", async () => {
    const res = await call("/nope");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });
});
