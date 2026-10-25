import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";
let ipCounter = 30;

const call = (path: string, init: RequestInit & { cookie?: string; ip?: string } = {}) => {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);
  headers.set("cf-connecting-ip", init.ip ?? `203.0.113.${ipCounter++}`);
  if (init.body) headers.set("content-type", "application/json");
  if (init.cookie) headers.set("cookie", init.cookie);
  return exports.default.fetch(`${ORIGIN}/api${path}`, { ...init, headers });
};

async function createMerchantUserSession(emailPrefix: string) {
  const email = `${emailPrefix}_${Date.now()}@example.com`;
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
  if (!cookie) throw new Error("No session cookie returned");

  const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: string }>();
  return { userId: user!.id, cookie: cookie.split(";")[0] ?? "" };
}

describe("Owner-Scoped /api/me Endpoints (F-09 / AC-09.2)", () => {
  it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
    const res = await call("/me/listing");
    expect(res.status).toBe(401);
  });

  it("returns listing: null when user has no linked merchant", async () => {
    const session = await createMerchantUserSession("unlinked");
    const res = await call("/me/listing", { cookie: session.cookie });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; data: { listing: unknown } };
    expect(body.ok).toBe(true);
    expect(body.data.listing).toBeNull();
  });

  it("retrieves claimed listing with private contact info and latest release", async () => {
    const session = await createMerchantUserSession("owner1");
    const merchantId = `m_owner1_${Date.now()}`;
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO merchants (
        id, public_id, owner_user_id, full_name, phone, whatsapp, telegram, shop_name, category,
        district, city, lat, lng, location_source, is_public_on_map, status,
        terms_version, terms_accepted_at, preferred_locale, created_at, updated_at
      ) VALUES (?, ?, ?, 'Anura Kumara', '+94771112233', '+94771112233', '@anura_shop', 'Kumara Stores', 'grocery', 'colombo', 'Pettah', 6.9344, 79.8541, 'pin', 1, 'listed', '2026-10-01', ?, 'en', ?, ?)`,
    )
      .bind(merchantId, `m_p${Date.now().toString().slice(-4)}`, session.userId, now, now, now)
      .run();

    const res = await call("/me/listing", { cookie: session.cookie });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      data: { listing: { shopName: string; telegram: string; isPublicOnMap: boolean } };
    };
    expect(body.ok).toBe(true);
    expect(body.data.listing.shopName).toBe("Kumara Stores");
    expect(body.data.listing.telegram).toBe("@anura_shop");
    expect(body.data.listing.isPublicOnMap).toBe(true);
  });

  it("enforces strict access isolation: user B cannot modify user A's listing (AC-09.2)", async () => {
    const sessionA = await createMerchantUserSession("user_a");
    const sessionB = await createMerchantUserSession("user_b");
    const now = Date.now();

    // User A owns Merchant A
    await env.DB.prepare(
      `INSERT INTO merchants (
        id, public_id, owner_user_id, full_name, phone, shop_name, category,
        district, city, lat, lng, location_source, is_public_on_map, status,
        terms_version, terms_accepted_at, preferred_locale, created_at, updated_at
      ) VALUES (?, ?, ?, 'Owner A', '+94771110001', 'Shop A', 'grocery', 'colombo', 'Colombo', 6.9, 79.8, 'pin', 1, 'listed', '2026-10-01', ?, 'en', ?, ?)`,
    )
      .bind(`m_a_${Date.now()}`, `m_a${Date.now().toString().slice(-4)}`, sessionA.userId, now, now, now)
      .run();

    // User B tries to PATCH /me/listing with malicious merchantId or without owning any merchant
    const resB = await call("/me/listing", {
      method: "PATCH",
      cookie: sessionB.cookie,
      body: JSON.stringify({ shopName: "Hacked by User B" }),
    });

    // Must return 404 since User B does not own any merchant listing
    expect(resB.status).toBe(404);

    // Verify Merchant A's shop name was NOT touched
    const rowA = await env.DB.prepare("SELECT shop_name FROM merchants WHERE owner_user_id = ?")
      .bind(sessionA.userId)
      .first<{ shop_name: string }>();
    expect(rowA?.shop_name).toBe("Shop A");
  });

  it("updates listing details and toggles map visibility", async () => {
    const session = await createMerchantUserSession("upd_owner");
    const merchantId = `m_upd_${Date.now()}`;
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO merchants (
        id, public_id, owner_user_id, full_name, phone, shop_name, category,
        district, city, lat, lng, location_source, is_public_on_map, status,
        terms_version, terms_accepted_at, preferred_locale, created_at, updated_at
      ) VALUES (?, ?, ?, 'Owner Upd', '+94771110002', 'Initial Shop Name', 'grocery', 'colombo', 'Pettah', 6.93, 79.85, 'pin', 1, 'listed', '2026-10-01', ?, 'en', ?, ?)`,
    )
      .bind(merchantId, `m_u${Date.now().toString().slice(-4)}`, session.userId, now, now, now)
      .run();

    const patchRes = await call("/me/listing", {
      method: "PATCH",
      cookie: session.cookie,
      body: JSON.stringify({
        shopName: "Updated Shop Name",
        category: "minimart",
        isPublicOnMap: false,
      }),
    });

    expect(patchRes.status).toBe(200);
    const body = (await patchRes.json()) as { ok: boolean; data: { listing: { shopName: string; isPublicOnMap: boolean } } };
    expect(body.ok).toBe(true);
    expect(body.data.listing.shopName).toBe("Updated Shop Name");
    expect(body.data.listing.isPublicOnMap).toBe(false);

    // Verify update in D1
    const row = await env.DB.prepare("SELECT shop_name, is_public_on_map FROM merchants WHERE id = ?")
      .bind(merchantId)
      .first<{ shop_name: string; is_public_on_map: number }>();
    expect(row?.shop_name).toBe("Updated Shop Name");
    expect(row?.is_public_on_map).toBe(0);
  });

  it("preserves hidden status if listing was hidden by admin", async () => {
    const session = await createMerchantUserSession("hidden_owner");
    const merchantId = `m_hid_${Date.now()}`;
    const now = Date.now();

    // Insert merchant with status = 'hidden' (e.g. under admin moderation)
    await env.DB.prepare(
      `INSERT INTO merchants (
        id, public_id, owner_user_id, full_name, phone, shop_name, category,
        district, city, lat, lng, location_source, is_public_on_map, status,
        terms_version, terms_accepted_at, preferred_locale, created_at, updated_at
      ) VALUES (?, ?, ?, 'Hidden Owner', '+94771110003', 'Under Review Shop', 'pharmacy', 'jaffna', 'Jaffna', 9.66, 80.01, 'pin', 0, 'hidden', '2026-10-01', ?, 'en', ?, ?)`,
    )
      .bind(merchantId, `m_h${Date.now().toString().slice(-4)}`, session.userId, now, now, now)
      .run();

    // Owner tries to set isPublicOnMap = true
    const patchRes = await call("/me/listing", {
      method: "PATCH",
      cookie: session.cookie,
      body: JSON.stringify({
        shopName: "Under Review Renamed",
        isPublicOnMap: true,
      }),
    });

    expect(patchRes.status).toBe(200);
    const row = await env.DB.prepare("SELECT status FROM merchants WHERE id = ?")
      .bind(merchantId)
      .first<{ status: string }>();
    // Status must remain 'hidden'
    expect(row?.status).toBe("hidden");
  });

  it("handles account deletion with exact confirmation and revokes sessions", async () => {
    const session = await createMerchantUserSession("del_owner");
    const merchantId = `m_del_${Date.now()}`;
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO merchants (
        id, public_id, owner_user_id, full_name, phone, shop_name, category,
        district, city, lat, lng, location_source, is_public_on_map, status,
        terms_version, terms_accepted_at, preferred_locale, created_at, updated_at
      ) VALUES (?, ?, ?, 'Delete Me', '+94771110004', 'Shop To Delete', 'bakery', 'kandy', 'Kandy', 7.29, 80.63, 'pin', 1, 'listed', '2026-10-01', ?, 'en', ?, ?)`,
    )
      .bind(merchantId, `m_d${Date.now().toString().slice(-4)}`, session.userId, now, now, now)
      .run();

    // Mismatched confirmation name must fail
    const failRes = await call("/me/account", {
      method: "DELETE",
      cookie: session.cookie,
      body: JSON.stringify({ confirmShopName: "Wrong Shop Name" }),
    });
    expect(failRes.status).toBe(422);

    // Exact match soft deletes and revokes session
    const deleteRes = await call("/me/account", {
      method: "DELETE",
      cookie: session.cookie,
      body: JSON.stringify({ confirmShopName: "Shop To Delete" }),
    });
    expect(deleteRes.status).toBe(200);

    // Verify merchant soft deleted in D1
    const merchant = await env.DB.prepare("SELECT deleted_at, is_public_on_map FROM merchants WHERE id = ?")
      .bind(merchantId)
      .first<{ deleted_at: number; is_public_on_map: number }>();
    expect(merchant?.deleted_at).toBeGreaterThan(0);
    expect(merchant?.is_public_on_map).toBe(0);

    // Subsequent request with the same cookie must now be unauthenticated (session revoked)
    const afterRes = await call("/me/listing", { cookie: session.cookie });
    expect(afterRes.status).toBe(401);
  });
});
