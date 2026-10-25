import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";
let ipCounter = 80;

const call = (path: string, init: RequestInit & { cookie?: string } = {}) => {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);
  headers.set("cf-connecting-ip", `203.0.113.${ipCounter++}`);
  if (init.body) headers.set("content-type", "application/json");
  if (init.cookie) headers.set("cookie", init.cookie);
  return exports.default.fetch(`${ORIGIN}/api${path}`, { ...init, headers });
};

async function getAdminCookie(): Promise<string> {
  const email = `admin_linker_${Date.now()}@example.com`;
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
  return cookie.split(";")[0] ?? "";
}

describe("Admin Link Merchant to User (F-09 §FR-09.3)", () => {
  it("rejects non-admins with 404", async () => {
    const res = await call("/admin/merchants/m_test/link-user", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
    });
    expect(res.status).toBe(404);
  });

  it("links merchant to user by email and creates audit log", async () => {
    const adminCookie = await getAdminCookie();
    const now = Date.now();

    // Create a merchant to be linked
    const merchantId = `m_link_${now}`;
    await env.DB.prepare(
      `INSERT INTO merchants (
        id, public_id, full_name, phone, shop_name, category, district, city,
        lat, lng, location_source, is_public_on_map, status, terms_version,
        terms_accepted_at, preferred_locale, created_at, updated_at
      ) VALUES (?, ?, 'Bandara', '+94771239999', 'Bandara Stores', 'grocery', 'kurunegala', 'Kurunegala', 7.48, 80.36, 'pin', 1, 'listed', '2026-10-01', ?, 'en', ?, ?)`,
    )
      .bind(merchantId, `m_l${now.toString().slice(-4)}`, now, now, now)
      .run();

    // Create target user
    const targetUserId = `u_target_${now}`;
    const targetEmail = `target_${now}@example.com`;
    await env.DB.prepare(
      "INSERT INTO users (id, name, email, email_verified, role, banned, locale, created_at, updated_at) VALUES (?, 'Bandara Target', ?, 1, 'merchant', 0, 'en', ?, ?)",
    )
      .bind(targetUserId, targetEmail, now, now)
      .run();

    // Admin links merchant to target user by email
    const res = await call(`/admin/merchants/${merchantId}/link-user`, {
      method: "POST",
      cookie: adminCookie,
      body: JSON.stringify({ email: targetEmail }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { merchantId: string; ownerUserId: string } };
    expect(body.ok).toBe(true);
    expect(body.data.ownerUserId).toBe(targetUserId);

    // Verify database row
    const merchant = await env.DB.prepare("SELECT owner_user_id FROM merchants WHERE id = ?")
      .bind(merchantId)
      .first<{ owner_user_id: string }>();
    expect(merchant?.owner_user_id).toBe(targetUserId);

    // Verify audit log
    const audit = await env.DB.prepare(
      "SELECT action, entity_id FROM admin_audit_log WHERE entity_id = ? AND action = 'merchant.link_owner'",
    )
      .bind(merchantId)
      .first<{ action: string; entity_id: string }>();
    expect(audit).toBeDefined();
    expect(audit?.action).toBe("merchant.link_owner");
  });
});
