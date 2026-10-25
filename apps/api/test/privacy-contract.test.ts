import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";

const call = (path: string, headers?: Record<string, string>) => {
  return exports.default.fetch(`${ORIGIN}${path}`, {
    headers,
    redirect: "manual",
  });
};

describe("Privacy Projection Contract Test (CLAUDE.md §8.4 & AC-04.1)", () => {
  it("strictly excludes merchant phone, whatsapp, email, and personal contacts from /api/merchants/geo", async () => {
    // Seed a merchant with private details
    const now = Date.now();
    const userId = "usr_contract_test_1";
    const merchantId = "mer_contract_test_1";
    const publicId = "m_priv99";

    // Clear KV to force query
    await env.CACHE_KV.delete("geo:version");

    await env.DB.prepare(
      `INSERT OR REPLACE INTO users (id, name, email, email_verified, role, created_at, updated_at)
       VALUES (?, 'Secret Owner', 'secret@owner.com', 1, 'merchant', ?, ?)`
    )
      .bind(userId, now, now)
      .run();

    await env.DB.prepare(
      `INSERT OR REPLACE INTO merchants (
        id, public_id, owner_user_id, full_name, phone, whatsapp, shop_name, category,
        district, city, lat, lng, location_source, terms_version, terms_accepted_at,
        status, is_public_on_map, is_supporter, created_at, updated_at
      ) VALUES (
        ?, ?, ?, 'Secret Owner', '0779998888', '0779998888', 'Contract Verified Shop',
        'supermarket', 'colombo', 'Pettah', 6.9344, 79.8541, 'pin', '2026-10-01', ?,
        'listed', 1, 0, ?, ?
      )`
    )
      .bind(merchantId, publicId, userId, now, now, now)
      .run();

    const res = await call("/api/merchants/geo");
    expect(res.status).toBe(200);

    const rawText = await res.text();
    // Critical assertion: raw response text must NOT contain private values anywhere
    expect(rawText).not.toContain("0779998888");
    expect(rawText).not.toContain("+94779998888");
    expect(rawText).not.toContain("secret@owner.com");
    expect(rawText).not.toContain("Secret Owner");

    const data = JSON.parse(rawText) as {
      type: string;
      features: Array<{ properties: Record<string, unknown> }>;
    };

    expect(data.type).toBe("FeatureCollection");
    const target = data.features.find((f) => f.properties.id === publicId);
    expect(target).toBeDefined();

    if (target) {
      // Exactly matches public whitelisted schema: no private fields
      const allowedKeys = ["id", "shopName", "category", "district", "city", "isSupporter", "since"];
      expect(Object.keys(target.properties).sort()).toEqual(allowedKeys.sort());

      expect(target.properties.phone).toBeUndefined();
      expect(target.properties.whatsapp).toBeUndefined();
      expect(target.properties.email).toBeUndefined();
      expect(target.properties.userId).toBeUndefined();
      expect(target.properties.user_id).toBeUndefined();
      expect(target.properties.owner_user_id).toBeUndefined();
      expect(target.properties.full_name).toBeUndefined();
    }
  });

  it("verifies /api/releases/latest does not expose internal secrets", async () => {
    const res = await call("/api/releases/latest");
    expect(res.status).toBe(200);
    const raw = await res.text();

    expect(raw).not.toContain("SECRET");
    expect(raw).not.toContain("API_KEY");
    expect(raw).not.toContain("TOKEN");
  });
});
