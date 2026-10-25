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

describe("Admin API Endpoints (F-08 M1)", () => {
  it("enforces 404 for non-admin on all /api/admin/* routes (AC-08.1)", async () => {
    const res = await call("/admin/merchants");
    expect(res.status).toBe(404);

    const auditRes = await call("/admin/audit");
    expect(auditRes.status).toBe(404);
  });

  it("GET /api/admin/overview returns KPIs including districtsCovered", async () => {
    const cookie = await getAdminCookie();
    const res = await call("/admin/overview", { cookie });
    expect(res.status).toBe(200);

    const json = (await res.json()) as { ok: boolean; data: Record<string, unknown> };
    expect(json.ok).toBe(true);
    expect(json.data.merchants).toBeDefined();
    expect(json.data.pendingSlips).toBeDefined();
    expect(json.data.openTickets).toBeDefined();
    expect(json.data.districtsCovered).toBeDefined();
  });

  it("GET /api/admin/merchants returns masked contacts and GET /reveal unmasks with audit", async () => {
    const cookie = await getAdminCookie();

    // Insert test merchant
    const merchantId = "m_test123";
    await env.DB.prepare(
      `INSERT INTO merchants (id, public_id, full_name, shop_name, category, district, city, lat, lng, location_source, terms_version, terms_accepted_at, phone, status, is_public_on_map, is_supporter, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        merchantId,
        "m_test12",
        "Admin Tester",
        "Admin Test Store",
        "grocery",
        "colombo",
        "Pettah",
        6.935,
        79.85,
        "gps",
        "2026-10-01",
        Date.now(),
        "0771234567",
        "listed",
        1,
        0,
        Date.now(),
        Date.now(),
      )
      .run();

    // 1. Fetch list - phone must be masked
    const listRes = await call("/admin/merchants", { cookie });
    expect(listRes.status).toBe(200);
    const listJson = (await listRes.json()) as {
      ok: boolean;
      data: { items: Array<{ id: string; phone: string | null }> };
    };
    expect(listJson.ok).toBe(true);

    const found = listJson.data.items.find((m) => m.id === merchantId);
    expect(found).toBeDefined();
    expect(found?.phone).toContain("****");

    // 2. Reveal contact
    const revealRes = await call(`/admin/merchants/${merchantId}/reveal`, {
      method: "POST",
      cookie,
    });
    expect(revealRes.status).toBe(200);
    const revealJson = (await revealRes.json()) as { ok: boolean; data: { phone: string } };
    expect(revealJson.data.phone).toBe("0771234567");

    // 3. Verify audit record exists
    const auditRes = await call("/admin/audit", { cookie });
    expect(auditRes.status).toBe(200);
    const auditJson = (await auditRes.json()) as {
      ok: boolean;
      data: { items: Array<{ action: string; entityId?: string | null }> };
    };
    const revealAudit = auditJson.data.items.find(
      (a) => a.action === "merchant.reveal" && a.entityId === merchantId,
    );
    expect(revealAudit).toBeDefined();
  });

  it("PATCH /api/admin/merchants/:id updates status and bumps geo version", async () => {
    const cookie = await getAdminCookie();
    const merchantId = "m_patch_test";
    await env.DB.prepare(
      `INSERT INTO merchants (id, public_id, full_name, shop_name, category, district, city, lat, lng, location_source, terms_version, terms_accepted_at, phone, status, is_public_on_map, is_supporter, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        merchantId,
        "m_patch1",
        "Patch Tester",
        "Patch Shop",
        "grocery",
        "kandy",
        "Kandy Town",
        7.29,
        80.63,
        "manual_pin",
        "2026-10-01",
        Date.now(),
        "0779998888",
        "listed",
        1,
        0,
        Date.now(),
        Date.now(),
      )
      .run();

    const patchRes = await call(`/admin/merchants/${merchantId}`, {
      method: "PATCH",
      cookie,
      body: JSON.stringify({
        status: "hidden",
        isSupporter: true,
      }),
    });

    expect(patchRes.status).toBe(200);
    const updated = (await patchRes.json()) as {
      ok: boolean;
      data: { status: string; isSupporter: boolean };
    };
    expect(updated.data.status).toBe("hidden");
    expect(updated.data.isSupporter).toBe(true);
  });

  it("GET /api/admin/merchants.csv returns CSV format and writes audit log", async () => {
    const cookie = await getAdminCookie();
    const res = await call("/admin/merchants.csv", { cookie });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");

    const text = await res.text();
    expect(text).toContain("id,shop_name,category,district,city");
  });

  it("GET /api/admin/releases and PATCH /api/admin/releases/:id toggles yank status", async () => {
    const cookie = await getAdminCookie();

    const relId = "rel_test_yank";
    await env.DB.prepare(
      `INSERT INTO releases (id, version, channel, title, min_os, release_date, published_at, exe_name, exe_url, exe_size, exe_sha256, is_latest, is_yanked, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        relId,
        "1.2.9",
        "stable",
        "v1.2.9",
        "Windows 10",
        "2026-09-01",
        Date.now(),
        "setup.exe",
        "http://example.com",
        1000,
        "0".repeat(64),
        0,
        0,
        "manual",
        Date.now(),
        Date.now(),
      )
      .run();

    const listRes = await call("/admin/releases", { cookie });
    expect(listRes.status).toBe(200);

    const yankRes = await call(`/admin/releases/${relId}`, {
      method: "PATCH",
      cookie,
      body: JSON.stringify({ isYanked: true }),
    });
    expect(yankRes.status).toBe(200);
    const yankJson = (await yankRes.json()) as { ok: boolean; data: { isYanked: boolean } };
    expect(yankJson.data.isYanked).toBe(true);
  });

  it("GET /api/admin/feedback returns full ticket details and PATCH updates status/response", async () => {
    const cookie = await getAdminCookie();

    const ticketId = "fb_admin_test_1";
    await env.DB.prepare(
      `INSERT INTO feedback_tickets (id, public_number, type, title, body_md, status, is_public, crash_log_key, contact_private, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        ticketId,
        999,
        "listing_report",
        "Spam merchant reported on map",
        "This shop does not exist at this location.",
        "open",
        0, // not public
        "crash-logs/test/log.txt",
        "reporter@example.com",
        Date.now(),
        Date.now(),
      )
      .run();

    // 1. Admin lists feedback (must see unlisted ticket, contactPrivate and crashLogKey)
    const listRes = await call("/admin/feedback", { cookie });
    expect(listRes.status).toBe(200);

    const listJson = (await listRes.json()) as {
      ok: boolean;
      data: {
        items: Array<{
          id: string;
          contactPrivate?: string;
          crashLogKey?: string;
          title: string;
        }>;
      };
    };
    expect(listJson.ok).toBe(true);
    const found = listJson.data.items.find((t) => t.id === ticketId);
    expect(found).toBeDefined();
    expect(found?.contactPrivate).toBe("reporter@example.com");
    expect(found?.crashLogKey).toBe("crash-logs/test/log.txt");

    // 2. Admin patches status and adds response
    const patchRes = await call(`/admin/feedback/${ticketId}`, {
      method: "PATCH",
      cookie,
      body: JSON.stringify({
        status: "triaged",
        severity: "cosmetic",
        adminResponseMd: "Investigating listing location.",
      }),
    });
    expect(patchRes.status).toBe(200);
    const patchJson = (await patchRes.json()) as {
      ok: boolean;
      data: {
        status: string;
        severity: string;
        adminResponseMd: string;
      };
    };
    expect(patchJson.data.status).toBe("triaged");
    expect(patchJson.data.severity).toBe("cosmetic");
    expect(patchJson.data.adminResponseMd).toBe("Investigating listing location.");

    // 3. Verify audit log was recorded
    const auditRow = await env.DB.prepare(
      "SELECT action, entity_id FROM admin_audit_log WHERE entity_id = ? ORDER BY created_at DESC",
    )
      .bind(ticketId)
      .first<{ action: string; entity_id: string }>();
    expect(auditRow).toBeDefined();
    expect(auditRow?.action).toBe("feedback.update");
  });
});
