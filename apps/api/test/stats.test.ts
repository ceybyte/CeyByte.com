import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";

const callStats = (headers?: Record<string, string>) => {
  return exports.default.fetch(`${ORIGIN}/api/stats`, { headers });
};

type StatsResponse = {
  ok: boolean;
  data: {
    districtsCovered: number;
    listedShops: number;
    supporters: number;
    calculatedAt: number;
  };
};

describe("GET /api/stats", () => {
  it("returns 200 with public cache-control and zero counts on clean database", async () => {
    // Clear KV if set
    await env.CACHE_KV.delete("stats:v1");

    const res = await callStats();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");

    const json = (await res.json()) as StatsResponse;
    expect(json.ok).toBe(true);
    expect(typeof json.data.districtsCovered).toBe("number");
    expect(typeof json.data.listedShops).toBe("number");
    expect(typeof json.data.supporters).toBe("number");
  });

  it("reflects seeded D1 merchants and approved donations", async () => {
    // Clear KV to ensure fresh D1 query
    await env.CACHE_KV.delete("stats:v1");

    const now = Date.now();
    // Insert 2 listed merchants in 2 districts
    await env.DB.prepare(
      `
      INSERT INTO merchants (
        id, public_id, full_name, phone, shop_name, category, district, city, lat, lng,
        location_source, is_public_on_map, status, terms_version, terms_accepted_at, created_at, updated_at
      ) VALUES
      ('m1', 'm_test1', 'Merchant One', '+94711111111', 'Shop One', 'grocery', 'colombo', 'Colombo', 6.9271, 79.8612, 'device_gps', 1, 'listed', '2026-10-01', ?, ?, ?),
      ('m2', 'm_test2', 'Merchant Two', '+94722222222', 'Shop Two', 'pharmacy', 'kandy', 'Kandy', 7.2906, 80.6337, 'device_gps', 1, 'listed', '2026-10-01', ?, ?, ?)
    `,
    )
      .bind(now, now, now, now, now, now)
      .run();

    // Insert 1 approved donation and 1 awaiting_payment donation
    await env.DB.prepare(
      `
      INSERT INTO donations (
        id, reference_code, method, amount_cents, status, submit_secret_hash, created_at, updated_at
      ) VALUES
      ('d1', 'CB-DN-TEST1', 'bank_transfer', 500000, 'approved', 'hash1', ?, ?),
      ('d2', 'CB-DN-TEST2', 'bank_transfer', 200000, 'awaiting_payment', 'hash2', ?, ?)
    `,
    )
      .bind(now, now, now, now)
      .run();

    const res = await callStats({ "cache-control": "no-cache" });
    expect(res.status).toBe(200);
    const json = (await res.json()) as StatsResponse;
    expect(json.ok).toBe(true);
    expect(json.data.districtsCovered).toBeGreaterThanOrEqual(2);
    expect(json.data.listedShops).toBeGreaterThanOrEqual(2);
    expect(json.data.supporters).toBeGreaterThanOrEqual(1);

    // Verify stats:v1 is cached in KV
    const kvValue = await env.CACHE_KV.get("stats:v1", "json");
    expect(kvValue).toEqual(json.data);
  });
});
