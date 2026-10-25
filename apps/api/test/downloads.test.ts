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

type DownloadGateResponse = {
  ok: boolean;
  data: {
    downloadUrl: string;
    claimToken: string;
    release: unknown;
  };
};

describe("Download Gate API (POST /api/downloads)", () => {
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

  it("processes valid JSON submission, creates listed merchant, sets cookies, and returns download URL", async () => {
    const payload = {
      turnstileToken: "cf-test-token",
      fullName: "Kasun Perera",
      shopName: "Kasun Grocery",
      category: "grocery",
      phone: "0771234567",
      whatsapp: "0771234567",
      district: "colombo",
      city: "Pettah",
      lat: 6.9344,
      lng: 79.8541,
      locationSource: "gps",
      isPublicOnMap: true,
      termsAccepted: true,
      termsVersion: "2026-09",
      preferredLocale: "en",
    };

    const res = await call("/api/downloads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);

    const json = (await res.json()) as DownloadGateResponse;
    expect(json.ok).toBe(true);
    expect(json.data.downloadUrl).toMatch(/^\/api\/download\/latest\?ref=m_/);
    expect(json.data.claimToken).toHaveLength(64); // 32 bytes hex

    // Verify Set-Cookie headers
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("cb_gate=m_");
    expect(setCookie).toContain("cb_gate_done=1");

    // Verify D1 database record
    const merchant = await env.DB.prepare(
      "SELECT id, public_id, full_name, shop_name, phone, status, is_public_on_map FROM merchants WHERE phone = '+94771234567'",
    ).first<{
      id: string;
      public_id: string;
      full_name: string;
      shop_name: string;
      phone: string;
      status: string;
      is_public_on_map: number;
    }>();

    expect(merchant).not.toBeNull();
    expect(merchant?.full_name).toBe("Kasun Perera");
    expect(merchant?.shop_name).toBe("Kasun Grocery");
    expect(merchant?.phone).toBe("+94771234567");
    expect(merchant?.status).toBe("listed");
    expect(merchant?.is_public_on_map).toBe(1);
    expect(json.data.downloadUrl).toContain(merchant?.public_id);
  });

  it("deduplicates on phone number and updates existing merchant record without duplicating", async () => {
    // Second submission with same phone number formatted differently
    const payload = {
      turnstileToken: "cf-test-token",
      fullName: "Kasun P. Perera",
      shopName: "Kasun Mini Mart",
      category: "minimart",
      phone: "+94 77 123 4567",
      district: "colombo",
      city: "Colombo 01",
      lat: 6.935,
      lng: 79.855,
      locationSource: "pin",
      isPublicOnMap: true,
      termsAccepted: true,
      termsVersion: "2026-09",
      preferredLocale: "si",
    };

    const res = await call("/api/downloads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);

    // Verify only 1 record exists for +94771234567
    const countResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM merchants WHERE phone = '+94771234567'",
    ).first<{ count: number }>();
    expect(countResult?.count).toBe(1);

    const updated = await env.DB.prepare(
      "SELECT shop_name, category, preferred_locale FROM merchants WHERE phone = '+94771234567'",
    ).first<{ shop_name: string; category: string; preferred_locale: string }>();
    expect(updated?.shop_name).toBe("Kasun Mini Mart");
    expect(updated?.category).toBe("minimart");
    expect(updated?.preferred_locale).toBe("si");
  });

  it("rejects coordinates outside Sri Lanka bounding box with 422", async () => {
    const payload = {
      turnstileToken: "cf-test-token",
      fullName: "Out of Bounds Merchant",
      shopName: "Global Shop",
      category: "other",
      phone: "0719998877",
      district: "colombo",
      city: "London",
      lat: 51.5074,
      lng: -0.1278,
      locationSource: "gps",
      isPublicOnMap: false,
      termsAccepted: true,
      termsVersion: "2026-09",
      preferredLocale: "en",
    };

    const res = await call("/api/downloads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(422);
    const json = (await res.json()) as { ok: boolean; error: { code: string; fields?: Record<string, string> } };
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION_FAILED");
    expect(json.error.fields?.lat).toBeDefined();
  });

  it("redirects with 303 for no-JS HTML form submissions", async () => {
    const params = new URLSearchParams({
      turnstileToken: "cf-test-token",
      fullName: "No JS Merchant",
      shopName: "Simple Bakery",
      category: "bakery",
      phone: "0751112233",
      district: "kandy",
      city: "Kandy",
      lat: "7.2906",
      lng: "80.6337",
      locationSource: "city_centroid",
      isPublicOnMap: "0",
      termsAccepted: "true",
      termsVersion: "2026-09",
      preferredLocale: "ta",
    });

    const res = await call("/api/downloads", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "text/html,application/xhtml+xml",
      },
      body: params.toString(),
    });

    expect(res.status).toBe(303);
    const location = res.headers.get("location");
    expect(location).toMatch(/^\/ta\/download\?done=1&ref=m_/);
  });
});
