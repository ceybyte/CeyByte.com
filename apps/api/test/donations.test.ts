import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";
let ipCounter = 10;

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

describe("Public Donations API (/api/donations)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
        return new Response(JSON.stringify({ success: true }));
      }
      return originalFetch(input, init);
    };

    // Clean up donations table and summary cache
    await env.DB.prepare("DELETE FROM donations").run();
    await env.CACHE_KV.delete("donations:summary");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("GET /api/donations/summary", () => {
    it("returns zero counts and active payment options when no approved donations exist", async () => {
      const res = await call("/donations/summary");
      expect(res.status).toBe(200);

      const json = (await res.json()) as { ok: boolean; data: any };
      expect(json.ok).toBe(true);
      expect(json.data.monthlyTotalCents).toBe(0);
      expect(json.data.totalSupportersCount).toBe(0);
      expect(json.data.supporters).toEqual([]);
      expect(Array.isArray(json.data.paymentOptions)).toBe(true);
      expect(json.data.paymentOptions.length).toBeGreaterThanOrEqual(1);
    });

    it("aggregates only approved donations and honors anonymity/message flags (AC-11.2)", async () => {
      const now = new Date().toISOString();

      // Seed unapproved donations: awaiting_payment, pending_review, rejected
      await env.DB.prepare(
        `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, display_name, created_at, updated_at)
         VALUES 
         ('d-await', 'CB-DN-000001', 'bank_transfer', 500000, 'awaiting_payment', 'hash1', 'Should Not Appear', ?, ?),
         ('d-pend', 'CB-DN-000002', 'bank_transfer', 300000, 'pending_review', 'hash2', 'Should Not Appear', ?, ?),
         ('d-rej', 'CB-DN-000003', 'bank_transfer', 200000, 'rejected', 'hash3', 'Should Not Appear', ?, ?)`,
      )
        .bind(now, now, now, now, now, now)
        .run();

      // Seed approved donations
      await env.DB.prepare(
        `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, display_name, is_anonymous, public_message, message_approved, show_amount_publicly, created_at, updated_at)
         VALUES 
         ('d-app1', 'CB-DN-000004', 'bank_transfer', 100000, 'approved', 'hash4', 'Ruwan Silva', 0, 'Great POS!', 1, 1, ?, ?),
         ('d-app2', 'CB-DN-000005', 'bank_transfer', 250000, 'approved', 'hash5', 'Secret Donor', 1, 'Secret note', 0, 0, ?, ?)`,
      )
        .bind(now, now, now, now)
        .run();

      const res = await call("/donations/summary");
      expect(res.status).toBe(200);

      const json = (await res.json()) as { ok: boolean; data: any };
      expect(json.ok).toBe(true);
      expect(json.data.monthlyTotalCents).toBe(350000); // 100,000 + 250,000
      expect(json.data.totalSupportersCount).toBe(2);
      expect(json.data.supporters).toHaveLength(2);

      const donor1 = json.data.supporters.find((s: any) => s.displayName === "Ruwan Silva");
      expect(donor1).toBeDefined();
      expect(donor1.amountCents).toBe(100000);
      expect(donor1.publicMessage).toBe("Great POS!");

      const donor2 = json.data.supporters.find((s: any) => s.displayName === "Anonymous Supporter");
      expect(donor2).toBeDefined();
      expect(donor2.amountCents).toBeNull();
      expect(donor2.publicMessage).toBeNull();
    });
  });

  describe("POST /api/donations", () => {
    it("validates amount >= Rs. 100 (10000 cents)", async () => {
      const res = await call("/donations", {
        method: "POST",
        body: JSON.stringify({
          amountCents: 5000, // Rs. 50 (below minimum)
          turnstileToken: "cf-test-token",
        }),
      });

      expect(res.status).toBe(422);
      const json = (await res.json()) as { ok: boolean; error: { code: string } };
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("VALIDATION_FAILED");
    });

    it("creates awaiting_payment record, sets cb_dn_{ref} cookie, and links merchant phone without leaking info", async () => {
      // Seed a merchant
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO merchants (id, public_id, full_name, phone, shop_name, category, district, city, lat, lng, location_source, terms_accepted_at, terms_version, created_at, updated_at)
         VALUES ('m-test-1', 'm_123456', 'Sunil Perera', '+94771234567', 'Sunil Stores', 'grocery', 'colombo', 'Pettah', 6.93, 79.85, 'pin', ?, '2026-10-01', ?, ?)`,
      )
        .bind(now, now, now)
        .run();

      const res = await call("/donations", {
        method: "POST",
        body: JSON.stringify({
          amountCents: 150000, // Rs. 1,500
          displayName: "Sunil Perera",
          isAnonymous: false,
          publicMessage: "For free software in Sri Lanka!",
          showAmountPublicly: true,
          linkMerchantPhone: "077 123 4567",
          turnstileToken: "cf-test-token",
        }),
      });

      expect(res.status).toBe(201);
      const json = (await res.json()) as { ok: boolean; data: any };
      expect(json.ok).toBe(true);
      expect(json.data.referenceCode).toMatch(/^CB-DN-[A-Z0-9]{6}$/);
      expect(json.data.amountCents).toBe(150000);
      expect(json.data.status).toBe("awaiting_payment");
      expect(Array.isArray(json.data.paymentOptions)).toBe(true);

      // Verify response does NOT reveal whether merchant exists or merchantId
      expect(json.data.merchantId).toBeUndefined();

      // Verify Set-Cookie header
      const cookies = res.headers.getSetCookie();
      const refCookie = cookies.find((c) => c.startsWith(`cb_dn_${json.data.referenceCode}=`));
      expect(refCookie).toBeDefined();
      expect(refCookie).toContain("HttpOnly");
      expect(refCookie).toContain("SameSite=Lax");

      // Verify DB record
      const row = await env.DB.prepare(
        "SELECT * FROM donations WHERE reference_code = ?",
      )
        .bind(json.data.referenceCode)
        .first<any>();

      expect(row).not.toBeNull();
      expect(row.status).toBe("awaiting_payment");
      expect(row.merchant_id).toBe("m-test-1"); // Merchant linked successfully in DB!
      expect(row.submit_secret_hash).toHaveLength(64); // SHA-256 hex string
    });
  });

  describe("POST /api/donations/:ref/submit", () => {
    it("rejects request if cb_dn_{ref} cookie is missing or invalid", async () => {
      const now = new Date().toISOString();
      await env.DB.prepare(
        `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, created_at, updated_at)
         VALUES ('d-sub1', 'CB-DN-TEST01', 'bank_transfer', 100000, 'awaiting_payment', 'deadbeef', ?, ?)`,
      )
        .bind(now, now)
        .run();

      // No cookie
      const resNoCookie = await call("/donations/CB-DN-TEST01/submit", {
        method: "POST",
        body: JSON.stringify({ slipKey: "slips/slip.png" }),
      });
      expect(resNoCookie.status).toBe(403);

      // Invalid cookie secret
      const resBadCookie = await call("/donations/CB-DN-TEST01/submit", {
        method: "POST",
        cookie: "cb_dn_CB-DN-TEST01=wrongsecret",
        body: JSON.stringify({ slipKey: "slips/slip.png" }),
      });
      expect(resBadCookie.status).toBe(403);
    });

    it("rejects and deletes slip with invalid magic bytes (AC-11.3)", async () => {
      // Create donation
      const createRes = await call("/donations", {
        method: "POST",
        body: JSON.stringify({
          amountCents: 100000,
          turnstileToken: "cf-test-token",
        }),
      });
      const createJson = (await createRes.json()) as { ok: boolean; data: any };
      const ref = createJson.data.referenceCode;
      const cookie = createRes.headers.getSetCookie().find((c) => c.startsWith(`cb_dn_${ref}=`));

      // Put an executable / fake PNG in R2 (starts with MZ header 4D 5A instead of PNG 89 50 4E 47)
      const fakeSlipKey = `slips/${ref}/fake.png`;
      const fakePayload = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      await env.UPLOADS.put(fakeSlipKey, fakePayload, {
        httpMetadata: { contentType: "image/png" },
      });

      const submitRes = await call(`/donations/${ref}/submit`, {
        method: "POST",
        cookie,
        body: JSON.stringify({ slipKey: fakeSlipKey }),
      });

      expect(submitRes.status).toBe(415);
      const submitJson = (await submitRes.json()) as { ok: boolean; error: { code: string } };
      expect(submitJson.error.code).toBe("FILE_TYPE_NOT_ALLOWED");

      // Verify file was deleted from R2
      const deletedCheck = await env.UPLOADS.get(fakeSlipKey);
      expect(deletedCheck).toBeNull();
    });

    it("rejects and deletes slip exceeding 5 MB (AC-11.1)", async () => {
      const createRes = await call("/donations", {
        method: "POST",
        body: JSON.stringify({
          amountCents: 100000,
          turnstileToken: "cf-test-token",
        }),
      });
      const createJson = (await createRes.json()) as { ok: boolean; data: any };
      const ref = createJson.data.referenceCode;
      const cookie = createRes.headers.getSetCookie().find((c) => c.startsWith(`cb_dn_${ref}=`));

      // Put an oversized file (> 5 MB) in R2
      const oversizedKey = `slips/${ref}/huge.jpg`;
      const oversizedPayload = new Uint8Array(5 * 1024 * 1024 + 100);
      oversizedPayload[0] = 0xff;
      oversizedPayload[1] = 0xd8;
      oversizedPayload[2] = 0xff;
      await env.UPLOADS.put(oversizedKey, oversizedPayload, {
        httpMetadata: { contentType: "image/jpeg" },
      });

      const submitRes = await call(`/donations/${ref}/submit`, {
        method: "POST",
        cookie,
        body: JSON.stringify({ slipKey: oversizedKey }),
      });

      expect(submitRes.status).toBe(413);
      const submitJson = (await submitRes.json()) as { ok: boolean; error: { code: string } };
      expect(submitJson.error.code).toBe("FILE_TOO_LARGE");

      // Verify file was deleted from R2
      const deletedCheck = await env.UPLOADS.get(oversizedKey);
      expect(deletedCheck).toBeNull();
    });

    it("verifies valid slip, updates status to pending_review, and supports status resumption", async () => {
      const createRes = await call("/donations", {
        method: "POST",
        body: JSON.stringify({
          amountCents: 200000,
          turnstileToken: "cf-test-token",
        }),
      });
      const createJson = (await createRes.json()) as { ok: boolean; data: any };
      const ref = createJson.data.referenceCode;
      const cookie = createRes.headers.getSetCookie().find((c) => c.startsWith(`cb_dn_${ref}=`));

      // Put a valid PNG slip
      const validSlipKey = `slips/${ref}/slip.png`;
      const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      await env.UPLOADS.put(validSlipKey, validPngBytes, {
        httpMetadata: { contentType: "image/png" },
      });

      const submitRes = await call(`/donations/${ref}/submit`, {
        method: "POST",
        cookie,
        body: JSON.stringify({
          slipKey: validSlipKey,
          txnReference: "FT2610269999",
        }),
      });

      expect(submitRes.status).toBe(200);
      const submitJson = (await submitRes.json()) as { ok: boolean; data: any };
      expect(submitJson.ok).toBe(true);
      expect(submitJson.data.status).toBe("pending_review");

      // Check DB updated
      const row = await env.DB.prepare("SELECT * FROM donations WHERE reference_code = ?")
        .bind(ref)
        .first<any>();
      expect(row.status).toBe("pending_review");
      expect(row.slip_key).toBe(validSlipKey);
      expect(row.slip_mime).toBe("image/png");
      expect(row.txn_reference).toBe("FT2610269999");

      // Resumption check: GET /api/donations/:ref/status
      const statusRes = await call(`/donations/${ref}/status`, { cookie });
      expect(statusRes.status).toBe(200);
      const statusJson = (await statusRes.json()) as { ok: boolean; data: any };
      expect(statusJson.ok).toBe(true);
      expect(statusJson.data.referenceCode).toBe(ref);
      expect(statusJson.data.status).toBe("pending_review");
      expect(statusJson.data.amountCents).toBe(200000);
      expect(Array.isArray(statusJson.data.paymentOptions)).toBe(true);
    });
  });
});
