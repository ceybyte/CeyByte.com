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

type GeoFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: string;
    shopName: string;
    category: string;
    district: string;
    city: string;
    isSupporter: boolean;
    since: string;
    [key: string]: unknown;
  };
};

type GeoCollectionResponse = {
  type: "FeatureCollection";
  version: number;
  generatedAt: string;
  features: GeoFeature[];
};

describe("GET /api/merchants/geo Endpoint", () => {
  it("AC-04.1: Strictly enforces privacy whitelist and strips all contact data", async () => {
    // Clear snapshot KV
    await env.CACHE_KV.delete("geo:version");
    await env.CACHE_KV.delete("geo:snapshot:v0");
    await env.CACHE_KV.delete("geo:snapshot:v1");

    const now = Date.now();
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO users (
        id, name, email, email_verified, role, created_at, updated_at
      ) VALUES (
        'usr_private_999', 'Private User', 'private@example.com', 1, 'merchant', ?, ?
      )
    `,
    )
      .bind(now, now)
      .run();

    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO merchants (
        id, public_id, owner_user_id, shop_name, full_name, category, phone, whatsapp, telegram,
        district, city, lat, lng, location_source, is_public_on_map, is_supporter, status,
        claim_token_hash, terms_accepted_at, terms_version, created_at, updated_at
      ) VALUES (
        'm_test_secret', 'm_sec123', 'usr_private_999', 'Perera Supermart', 'Kamal Perera',
        'grocery', '+94771234567', '+94779876543', '@secrettelegram',
        'colombo', 'Pettah', 6.934444, 79.851234, 'gps', 1, 1, 'listed',
        'super_secret_claim_token_hash', ?, '2026-10-01', ?, ?
      )
    `,
    )
      .bind(now, now, now)
      .run();

    const res = await call("/api/merchants/geo");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/geo+json");

    const text = await res.text();

    // Contract test assertions (AC-04.1)
    expect(text).not.toContain("+94771234567");
    expect(text).not.toContain("+94779876543");
    expect(text).not.toContain("@secrettelegram");
    expect(text).not.toContain("Kamal Perera");
    expect(text).not.toContain("usr_private_999");
    expect(text).not.toContain("super_secret_claim_token_hash");

    const json = JSON.parse(text) as GeoCollectionResponse;
    expect(json.type).toBe("FeatureCollection");
    expect(json.features.length).toBeGreaterThan(0);

    const feature = json.features.find((f) => f.properties.id === "m_sec123");
    expect(feature).toBeDefined();
    if (feature) {
      // Verify allowed properties whitelist
      const allowedKeys = ["id", "shopName", "category", "district", "city", "isSupporter", "since"];
      const actualKeys = Object.keys(feature.properties);
      expect(actualKeys.sort()).toEqual(allowedKeys.sort());

      // Verify 4-decimal place rounding for coordinates [lng, lat]
      expect(feature.geometry.coordinates).toEqual([79.8512, 6.9344]);
      expect(feature.properties.isSupporter).toBe(true);
    }
  });

  it("AC-04.2: Excludes merchants that are unlisted, private on map, or soft-deleted", async () => {
    const now = Date.now();
    // 1. Private on map (is_public_on_map = 0)
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO merchants (
        id, public_id, shop_name, full_name, category, phone, district, city, lat, lng, location_source,
        is_public_on_map, status, terms_accepted_at, terms_version, created_at, updated_at
      ) VALUES (
        'm_test_private', 'm_priv01', 'Private Shop', 'Private Owner', 'retail', '+94770000001',
        'kandy', 'Kandy', 7.29, 80.63, 'pin', 0, 'listed', ?, '2026-10-01', ?, ?
      )
    `,
    )
      .bind(now, now, now)
      .run();

    // 2. Pending status (status = 'pending')
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO merchants (
        id, public_id, shop_name, full_name, category, phone, district, city, lat, lng, location_source,
        is_public_on_map, status, terms_accepted_at, terms_version, created_at, updated_at
      ) VALUES (
        'm_test_pending', 'm_pend01', 'Pending Shop', 'Pending Owner', 'retail', '+94770000002',
        'galle', 'Galle', 6.05, 80.22, 'pin', 1, 'pending', ?, '2026-10-01', ?, ?
      )
    `,
    )
      .bind(now, now, now)
      .run();

    // 3. Soft-deleted merchant (deleted_at IS NOT NULL)
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO merchants (
        id, public_id, shop_name, full_name, category, phone, district, city, lat, lng, location_source,
        is_public_on_map, status, terms_accepted_at, terms_version, deleted_at, created_at, updated_at
      ) VALUES (
        'm_test_deleted', 'm_del001', 'Deleted Shop', 'Deleted Owner', 'retail', '+94770000003',
        'jaffna', 'Jaffna', 9.66, 80.02, 'pin', 1, 'listed', ?, '2026-10-01', ?, ?, ?
      )
    `,
    )
      .bind(now, now, now, now)
      .run();

    // Purge cached snapshot to force fresh D1 read
    await env.CACHE_KV.delete("geo:version");
    await env.CACHE_KV.delete("geo:snapshot:v0");

    const res = await call("/api/merchants/geo");
    expect(res.status).toBe(200);
    const json = (await res.json()) as GeoCollectionResponse;

    const ids = json.features.map((f) => f.properties.id);
    expect(ids).not.toContain("m_priv01");
    expect(ids).not.toContain("m_pend01");
    expect(ids).not.toContain("m_del001");
  });

  it("TRD §10: Emits ETag and returns 304 Not Modified when ETag matches", async () => {
    const res1 = await call("/api/merchants/geo");
    expect(res1.status).toBe(200);

    const etag = res1.headers.get("etag");
    expect(etag).toBeDefined();
    expect(etag).toMatch(/^W\/"geo-\d+"$/);
    expect(res1.headers.get("cache-control")).toBe(
      "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
    );

    // Call with matching ETag
    const res2 = await call("/api/merchants/geo", {
      "if-none-match": etag ?? "",
    });
    expect(res2.status).toBe(304);
    expect(res2.headers.get("etag")).toBe(etag);
  });
});
