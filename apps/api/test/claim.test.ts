import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { claimListingFromCookie } from "../src/lib/claim";
import { hmacSha256Hex, sha256Hex } from "../src/lib/crypto";

const ORIGIN = "http://localhost:3000";
const IP = "203.0.113.12";

const call = (path: string, init: RequestInit & { cookie?: string } = {}) => {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);
  headers.set("cf-connecting-ip", IP);
  if (init.body) headers.set("content-type", "application/json");
  if (init.cookie) headers.set("cookie", init.cookie);
  return exports.default.fetch(`${ORIGIN}/api${path}`, { ...init, headers });
};

describe("Merchant Claim Flow & Security (F-09 / AC-09.1)", () => {
  it("rejects invalid or tampered cb_claim cookie in claimListingFromCookie", async () => {
    const fakeToken = "11112222333344445555666677778888";
    const invalidCookie = `cb_claim=${fakeToken}.invalid_signature`;

    const result = await claimListingFromCookie(env, {} as any, "user_1", invalidCookie);
    expect(result.claimed).toBe(false);
  });

  it("claims unredeemed merchant with valid HMAC signed cb_claim cookie", async () => {
    const rawToken = "abcd1234efgh5678abcd1234efgh5678";
    const tokenHash = await sha256Hex(rawToken);
    const signature = await hmacSha256Hex(env.CLAIM_TOKEN_SECRET, rawToken);
    const cookie = `cb_claim=${rawToken}.${signature}`;

    const merchantId = `m_claim_test_${Date.now()}`;
    const now = Date.now();

    // Insert an unredeemed merchant into D1
    await env.DB.prepare(
      `INSERT INTO merchants (
        id, public_id, full_name, phone, shop_name, category, district, city,
        lat, lng, location_source, is_public_on_map, status, terms_version,
        terms_accepted_at, claim_token_hash, preferred_locale, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'listed', '2026-10-01', ?, ?, 'en', ?, ?)`,
    )
      .bind(
        merchantId,
        `m_c${Date.now().toString().slice(-4)}`,
        "Kamal Silva",
        `+9477${Math.floor(1000000 + Math.random() * 9000000)}`,
        "Silva Bakers",
        "bakery",
        "gampaha",
        "Negombo",
        7.2088,
        79.8358,
        "gps",
        now,
        tokenHash,
        now,
        now,
      )
      .run();

    const userId = `u_claimant_${Date.now()}`;
    await env.DB.prepare(
      "INSERT INTO users (id, name, email, email_verified, role, banned, locale, created_at, updated_at) VALUES (?, 'Kamal Silva', ?, 1, 'merchant', 0, 'en', ?, ?)",
    )
      .bind(userId, `kamal_${Date.now()}@example.com`, now, now)
      .run();

    const claimRes = await claimListingFromCookie(env, {} as any, userId, cookie);
    expect(claimRes.claimed).toBe(true);
    expect(claimRes.merchantId).toBe(merchantId);

    // Verify merchant in DB now has owner_user_id and claim_redeemed_at
    const updated = await env.DB.prepare(
      "SELECT owner_user_id, claim_redeemed_at FROM merchants WHERE id = ?",
    )
      .bind(merchantId)
      .first<{ owner_user_id: string; claim_redeemed_at: number }>();

    expect(updated?.owner_user_id).toBe(userId);
    expect(updated?.claim_redeemed_at).toBeGreaterThan(0);

    // Verify merchant log was written
    const log = await env.DB.prepare(
      "SELECT event FROM merchant_logs WHERE merchant_id = ? AND event = 'listing_claimed'",
    )
      .bind(merchantId)
      .first<{ event: string }>();
    expect(log?.event).toBe("listing_claimed");

    // Second redemption attempt with the same cookie must fail (single-use)
    const secondRes = await claimListingFromCookie(env, {} as any, "user_other", cookie);
    expect(secondRes.claimed).toBe(false);
  });

  it("POST /api/downloads issues a signed cb_claim cookie", async () => {
    // Mock Turnstile siteverify
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
        return new Response(JSON.stringify({ success: true }));
      }
      return originalFetch(input, init);
    };

    try {
      const payload = {
        fullName: "Sunil Shantha",
        shopName: "Shantha Hardware",
        category: "hardware",
        phone: "0712345678",
        district: "kandy",
        city: "Kandy",
        lat: 7.2906,
        lng: 80.6337,
        locationSource: "pin",
        isPublicOnMap: true,
        termsAccepted: true,
        termsVersion: "2026-10-01",
        preferredLocale: "en",
        turnstileToken: "mock-valid-turnstile",
      };

      const res = await call("/downloads", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const cookies = res.headers.getSetCookie();
      const claimCookie = cookies.find((c) => c.startsWith("cb_claim="));
      expect(claimCookie).toBeDefined();

      // Check cookie structure: token.signature
      const cookieValue = claimCookie?.split(";")[0]?.split("=")[1];
      expect(cookieValue).toBeDefined();
      const [token, sig] = cookieValue!.split(".");
      expect(token).toHaveLength(64);
      expect(sig).toBeDefined();

      const expectedSig = await hmacSha256Hex(env.CLAIM_TOKEN_SECRET, token!);
      expect(sig).toBe(expectedSig);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
