import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";
let ipCounter = 200;

const call = (
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    cookie?: string;
    ip?: string;
  } = {},
) => {
  const headers = new Headers(options.headers);
  headers.set("origin", ORIGIN);
  headers.set("cf-connecting-ip", options.ip ?? `203.0.113.${ipCounter++}`);
  if (options.body) headers.set("content-type", "application/json");
  if (options.cookie) headers.set("cookie", options.cookie);

  return exports.default.fetch(`${ORIGIN}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    redirect: "manual",
  });
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

describe("Admin Donations Management API (/api/admin/donations)", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM donations").run();
    await env.DB.prepare("DELETE FROM merchants").run();
    await env.CACHE_KV.delete("geo:version");
    await env.CACHE_KV.delete("geo:snapshot:v0");
    await env.CACHE_KV.delete("geo:snapshot:v1");
    await env.CACHE_KV.delete("donations:summary");
  });

  it("enforces 404 for non-admin on all /api/admin/donations routes", async () => {
    const listRes = await call("/admin/donations");
    expect(listRes.status).toBe(404);

    const approveRes = await call("/admin/donations/d-123/approve", { method: "POST" });
    expect(approveRes.status).toBe(404);

    const rejectRes = await call("/admin/donations/d-123/reject", { method: "POST" });
    expect(rejectRes.status).toBe(404);

    const slipRes = await call("/admin/donations/d-123/slip-url");
    expect(slipRes.status).toBe(404);
  });

  it("GET /api/admin/donations lists donations with filtering and oldest-first for pending_review", async () => {
    const cookie = await getAdminCookie();
    const t1 = new Date(Date.now() - 3600000).toISOString();
    const t2 = new Date(Date.now() - 1800000).toISOString();
    const t3 = new Date(Date.now() - 900000).toISOString();

    // Insert merchants
    await env.DB.prepare(
      `INSERT INTO merchants (id, public_id, full_name, phone, shop_name, category, district, city, lat, lng, location_source, terms_accepted_at, terms_version, created_at, updated_at)
       VALUES ('m-1', 'm_111111', 'Owner 1', '+94771111111', 'Shop Alpha', 'grocery', 'colombo', 'Pettah', 6.93, 79.85, 'pin', ?, '2026-10-01', ?, ?)`,
    )
      .bind(t1, t1, t1)
      .run();

    // Insert donations
    await env.DB.prepare(
      `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, display_name, merchant_id, created_at, updated_at)
       VALUES 
       ('d-older', 'CB-DN-111111', 'bank_transfer', 150000, 'pending_review', 'hash1', 'Donor Old', 'm-1', ?, ?),
       ('d-newer', 'CB-DN-222222', 'bank_transfer', 250000, 'pending_review', 'hash2', 'Donor New', NULL, ?, ?),
       ('d-appr', 'CB-DN-333333', 'bank_transfer', 500000, 'approved', 'hash3', 'Donor Appr', NULL, ?, ?)`,
    )
      .bind(t1, t1, t2, t2, t3, t3)
      .run();

    // Query pending_review
    const resPending = await call("/admin/donations?status=pending_review", { cookie });
    expect(resPending.status).toBe(200);

    const jsonPending = (await resPending.json()) as {
      ok: boolean;
      data: { items: Array<{ id: string; shopName?: string | null }> };
    };
    expect(jsonPending.ok).toBe(true);
    expect(jsonPending.data.items).toHaveLength(2);
    // Oldest first
    expect(jsonPending.data.items[0].id).toBe("d-older");
    expect(jsonPending.data.items[0].shopName).toBe("Shop Alpha");
    expect(jsonPending.data.items[1].id).toBe("d-newer");

    // Query approved
    const resAppr = await call("/admin/donations?status=approved", { cookie });
    const jsonAppr = (await resAppr.json()) as {
      ok: boolean;
      data: { items: Array<{ id: string }> };
    };
    expect(jsonAppr.data.items).toHaveLength(1);
    expect(jsonAppr.data.items[0].id).toBe("d-appr");
  });

  it("GET /api/admin/donations/:id/slip-url returns presigned preview URL", async () => {
    const cookie = await getAdminCookie();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, slip_key, slip_mime, slip_size, created_at, updated_at)
       VALUES ('d-slip', 'CB-DN-SLIP01', 'bank_transfer', 100000, 'pending_review', 'hash', 'slips/CB-DN-SLIP01/abc.png', 'image/png', 12345, ?, ?)`,
    )
      .bind(now, now)
      .run();

    const res = await call("/admin/donations/d-slip/slip-url", { cookie });
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      ok: boolean;
      data: { url?: string; mime?: string; size?: number };
    };
    expect(json.ok).toBe(true);
    expect(json.data.url).toBeDefined();
    expect(json.data.mime).toBe("image/png");
    expect(json.data.size).toBe(12345);
  });

  it("POST /api/admin/donations/:id/approve activates gold pin in <60s via bumpGeoVersion (AC-08.2)", async () => {
    const cookie = await getAdminCookie();
    const now = new Date().toISOString();

    // Insert public merchant
    await env.DB.prepare(
      `INSERT INTO merchants (id, public_id, full_name, phone, shop_name, category, district, city, lat, lng, location_source, is_public_on_map, is_supporter, status, terms_accepted_at, terms_version, created_at, updated_at)
       VALUES ('m-gold', 'm_gold01', 'Golden Owner', '+94779999999', 'Gold Corner', 'cafe', 'colombo', 'Colombo 03', 6.91, 79.85, 'pin', 1, 0, 'listed', ?, '2026-10-01', ?, ?)`,
    )
      .bind(now, now, now)
      .run();

    // Insert pending donation linked to merchant
    await env.DB.prepare(
      `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, public_message, merchant_id, created_at, updated_at)
       VALUES ('d-gold', 'CB-DN-GOLD01', 'bank_transfer', 500000, 'pending_review', 'hash', 'Love this project!', 'm-gold', ?, ?)`,
    )
      .bind(now, now)
      .run();

    // Cache summary to verify invalidation
    await env.CACHE_KV.put("donations:summary", JSON.stringify({ stale: true }));

    // Approve donation
    const res = await call("/admin/donations/d-gold/approve", {
      method: "POST",
      cookie,
      body: JSON.stringify({ messageApproved: true }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { status: string } };
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("approved");

    // Verify donation DB state
    const dRow = await env.DB.prepare("SELECT * FROM donations WHERE id = 'd-gold'").first<{
      status: string;
      message_approved: number;
      reviewed_by: string | null;
      reviewed_at: string | null;
    }>();
    expect(dRow?.status).toBe("approved");
    expect(dRow?.message_approved).toBe(1);
    expect(dRow?.reviewed_by).toBeDefined();
    expect(dRow?.reviewed_at).toBeDefined();

    // Verify merchant is now gold supporter
    const mRow = await env.DB.prepare("SELECT * FROM merchants WHERE id = 'm-gold'").first<{
      is_supporter: number;
      supporter_since: string | null;
    }>();
    expect(mRow?.is_supporter).toBe(1);
    expect(mRow?.supporter_since).toBeDefined();

    // Verify geo version bumped in KV
    const geoVer = await env.CACHE_KV.get<{ n: number }>("geo:version", "json");
    expect(geoVer).not.toBeNull();
    expect(geoVer?.n).toBeGreaterThanOrEqual(1);

    // Verify geo snapshot in KV includes isSupporter: true
    const snapshot = await env.CACHE_KV.get<{
      features: Array<{ properties: { id: string; isSupporter: boolean } }>;
    }>(`geo:snapshot:v${geoVer?.n}`, "json");
    expect(snapshot).not.toBeNull();
    const feature = snapshot?.features.find((f) => f.properties.id === "m_gold01");
    expect(feature).toBeDefined();
    expect(feature?.properties.isSupporter).toBe(true);

    // Verify summary cache was purged
    const summaryCheck = await env.CACHE_KV.get("donations:summary");
    expect(summaryCheck).toBeNull();

    // Verify admin audit log
    const audit = await env.DB.prepare(
      "SELECT * FROM admin_audit_log WHERE entity_type = 'donation' AND entity_id = 'd-gold' ORDER BY created_at DESC LIMIT 1",
    ).first<{ id: string; action: string }>();
    expect(audit).not.toBeNull();
    expect(audit?.action).toBe("approve");
  });

  it("POST /api/admin/donations/:id/reject records reason and audit log", async () => {
    const cookie = await getAdminCookie();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, created_at, updated_at)
       VALUES ('d-rej', 'CB-DN-REJ001', 'bank_transfer', 100000, 'pending_review', 'hash', ?, ?)`,
    )
      .bind(now, now)
      .run();

    // Rejects empty reason
    const failRes = await call("/admin/donations/d-rej/reject", {
      method: "POST",
      cookie,
      body: JSON.stringify({ reason: "" }),
    });
    expect(failRes.status).toBe(400);

    // Success rejection
    const res = await call("/admin/donations/d-rej/reject", {
      method: "POST",
      cookie,
      body: JSON.stringify({ reason: "Slip was illegible / blurry photo" }),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; data: { status: string } };
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("rejected");

    const row = await env.DB.prepare("SELECT * FROM donations WHERE id = 'd-rej'").first<{
      status: string;
      rejection_reason: string;
      reviewed_by: string | null;
      reviewed_at: string | null;
    }>();
    expect(row?.status).toBe("rejected");
    expect(row?.rejection_reason).toBe("Slip was illegible / blurry photo");
    expect(row?.reviewed_by).toBeDefined();
    expect(row?.reviewed_at).toBeDefined();
  });
});
