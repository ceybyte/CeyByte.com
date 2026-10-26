import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import type { DonationPaymentOptions } from "@cbpos/shared";

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

let cachedAdminCookie: string | null = null;
async function getAdminCookie(): Promise<string> {
  if (cachedAdminCookie) return cachedAdminCookie;
  const email = "superadmin@example.com";
  await call("/auth/email-otp/send-verification-otp", {
    method: "POST",
    body: JSON.stringify({ email, type: "sign-in" }),
  });

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
  const cookie = res.headers.getSetCookie().find((c) => c.includes("better-auth.session_token"));
  if (!cookie) throw new Error("no session cookie");

  await env.DB.prepare("UPDATE users SET role = 'admin' WHERE email = ?").bind(email).run();
  cachedAdminCookie = cookie.split(";")[0] ?? "";
  return cachedAdminCookie;
}

describe("Admin Donation Payment Settings API", () => {
  it("enforces 404 for non-admin on /api/admin/donations/settings", async () => {
    const res = await call("/admin/donations/settings");
    expect(res.status).toBe(404);
  });

  it("GET /api/admin/donations/settings falls back to defaults when KV is empty", async () => {
    await env.CACHE_KV.delete("settings:donation_payment_options");
    const cookie = await getAdminCookie();

    const res = await call("/admin/donations/settings", { cookie });
    expect(res.status).toBe(200);

    const json = (await res.json()) as { ok: boolean; data: DonationPaymentOptions };
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data[0]).toMatchObject({
      id: expect.any(String),
      accountName: expect.any(String),
      accountNumber: expect.any(String),
      bankName: expect.any(String),
      branchName: expect.any(String),
      isEnabled: true,
    });
  });

  it("PUT /api/admin/donations/settings updates payment options in KV and logs audit", async () => {
    const cookie = await getAdminCookie();

    const newOptions = [
      {
        id: "bank-1",
        accountName: "CeyByte Foundation",
        accountNumber: "8001234567",
        bankName: "Commercial Bank",
        branchName: "Kollupitiya",
        qrImageKey: "qr-codes/combank.png",
        isEnabled: true,
        notes: "Primary account for LKR donations",
      },
      {
        id: "bank-2",
        accountName: "CeyByte Foundation",
        accountNumber: "1009876543",
        bankName: "Bank of Ceylon",
        branchName: "Corporate Branch",
        qrImageKey: null,
        isEnabled: false,
        notes: "Secondary backup",
      },
    ];

    const putRes = await call("/admin/donations/settings", {
      method: "PUT",
      cookie,
      body: JSON.stringify(newOptions),
    });

    expect(putRes.status).toBe(200);
    const putJson = (await putRes.json()) as { ok: boolean; data: DonationPaymentOptions };
    expect(putJson.ok).toBe(true);
    expect(putJson.data).toHaveLength(2);
    expect(putJson.data[0]?.accountNumber).toBe("8001234567");

    // Verify KV persistence
    const kvValue = await env.CACHE_KV.get("settings:donation_payment_options", "json");
    expect(kvValue).toEqual(newOptions);

    // Verify GET returns the newly set options
    const getRes = await call("/admin/donations/settings", { cookie });
    const getJson = (await getRes.json()) as { ok: boolean; data: DonationPaymentOptions };
    expect(getJson.data).toEqual(newOptions);

    // Verify admin_audit_log entry
    const auditRow = await env.DB.prepare(
      "SELECT * FROM admin_audit_log WHERE entity_type = 'donation' AND action = 'update_payment_settings' ORDER BY created_at DESC LIMIT 1",
    ).first<{ id: string; action: string; diff: string }>();

    expect(auditRow).not.toBeNull();
    expect(auditRow?.action).toBe("update_payment_settings");
    const diff = JSON.parse(auditRow?.diff ?? "{}");
    expect(diff.after).toEqual(newOptions);
  });

  it("PUT /api/admin/donations/settings rejects invalid payload", async () => {
    const cookie = await getAdminCookie();

    const invalidPayload = [
      {
        id: "bank-1",
        // missing required fields
        bankName: "Commercial Bank",
      },
    ];

    const putRes = await call("/admin/donations/settings", {
      method: "PUT",
      cookie,
      body: JSON.stringify(invalidPayload),
    });

    expect(putRes.status).toBe(400);
  });
});
