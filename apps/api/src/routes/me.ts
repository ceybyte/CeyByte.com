import {
  BUSINESS_CATEGORIES,
  DISTRICTS,
  LOCALES,
  SRI_LANKA_BOUNDS,
  type BusinessCategory,
  type District,
  type Locale,
} from "@cbpos/shared/enums";
import {
  donations,
  feedbackTickets,
  merchantLogs,
  merchants,
  sessions,
  users,
} from "@cbpos/shared/db/schema";
import { normalizePhone } from "@cbpos/shared/phone";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import { hmacSha256Hex, safeEqual, sha256Hex } from "../lib/crypto";
import { ApiError } from "../lib/errors";
import { bumpGeoVersion } from "../lib/geo-cache";
import { rateLimit } from "../lib/ratelimit";
import { requireSession } from "../middleware/session";
import type { AppEnv } from "../types";

const UpdateListingSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(2, { message: "errors.required" })
    .max(100, { message: "errors.too_long" })
    .optional(),
  category: z.enum(BUSINESS_CATEGORIES as unknown as [string, ...string[]]).optional(),
  district: z.enum(DISTRICTS as unknown as [string, ...string[]]).optional(),
  city: z
    .string()
    .trim()
    .min(1, { message: "errors.required" })
    .max(100, { message: "errors.too_long" })
    .optional(),
  lat: z.number().min(SRI_LANKA_BOUNDS.minLat).max(SRI_LANKA_BOUNDS.maxLat).optional(),
  lng: z.number().min(SRI_LANKA_BOUNDS.minLng).max(SRI_LANKA_BOUNDS.maxLng).optional(),
  whatsapp: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return normalizePhone(val, ["mobile"]) !== null;
      },
      { message: "errors.INVALID_PHONE" },
    ),
  telegram: z.string().trim().max(50).nullable().optional(),
  isPublicOnMap: z.boolean().optional(),
});

const DeleteAccountSchema = z.object({
  confirmShopName: z.string().trim(),
});

const ClaimFallbackSchema = z.object({
  phone: z.string().trim().optional(),
  claimToken: z.string().trim().optional(),
});

function getSession(c: Context<AppEnv>) {
  const session = c.get("session");
  if (!session) throw new ApiError("UNAUTHENTICATED");
  return session;
}

// /api/me/* (01-PRD §F-09, 02-TRD §5.1, 04-APP_FLOW §Flow 6)
export const meRoutes = new Hono<AppEnv>()
  .use("/me/*", requireSession)

  // 1. GET /api/me/listing
  .get("/me/listing", async (c) => {
    const session = getSession(c);
    const db = c.get("db");

    const listing = await db.query.merchants.findFirst({
      where: and(eq(merchants.ownerUserId, session.user.id), isNull(merchants.deletedAt)),
    });

    const latestRelease = (await c.env.CACHE_KV.get("release:latest", "json")) ?? null;

    return c.json({
      ok: true,
      data: {
        listing: listing ?? null,
        latestRelease,
      },
    });
  })

  // 2. PATCH /api/me/listing
  .patch("/me/listing", async (c) => {
    const session = getSession(c);
    const db = c.get("db");

    const merchant = await db.query.merchants.findFirst({
      where: and(eq(merchants.ownerUserId, session.user.id), isNull(merchants.deletedAt)),
    });

    if (!merchant) {
      throw new ApiError("NOT_FOUND");
    }

    const rawBody = await c.req.json().catch(() => ({}));
    const parse = UpdateListingSchema.safeParse(rawBody);
    if (!parse.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parse.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      throw new ApiError("VALIDATION_FAILED", { fields: fieldErrors });
    }

    const data = parse.data;
    const now = Date.now();

    // Rule: merchant controls isPublicOnMap visibility; status is managed by admin moderation (01-PRD §FR-09.5)
    const newStatus = merchant.status;
    let newIsPublic = merchant.isPublicOnMap;

    if (data.isPublicOnMap !== undefined) {
      newIsPublic = data.isPublicOnMap;
    }

    const normalizedWhatsapp =
      data.whatsapp !== undefined
        ? data.whatsapp && data.whatsapp.trim() !== ""
          ? normalizePhone(data.whatsapp, ["mobile"])
          : null
        : merchant.whatsapp;

    await db
      .update(merchants)
      .set({
        shopName: data.shopName ?? merchant.shopName,
        category: (data.category as BusinessCategory) ?? merchant.category,
        district: (data.district as District) ?? merchant.district,
        city: data.city ?? merchant.city,
        lat: data.lat ?? merchant.lat,
        lng: data.lng ?? merchant.lng,
        whatsapp: normalizedWhatsapp,
        telegram: data.telegram !== undefined ? data.telegram : merchant.telegram,
        isPublicOnMap: newIsPublic,
        status: newStatus,
        updatedAt: new Date(now),
      })
      .where(eq(merchants.id, merchant.id));

    // Invalidate geo-cache if public status or coordinates/details changed
    if (merchant.status !== "hidden") {
      await bumpGeoVersion(c.env.CACHE_KV, db);
    }

    // Insert audit log
    await db.insert(merchantLogs).values({
      id: `ml_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      merchantId: merchant.id,
      event: "listing_updated",
      meta: {
        fields: Object.keys(data).join(","),
      },
      createdAt: new Date(now),
    });

    const updated = await db.query.merchants.findFirst({
      where: eq(merchants.id, merchant.id),
    });

    return c.json({
      ok: true,
      data: {
        listing: updated,
      },
    });
  })

  // 3. POST /api/me/claim (Hybrid claim fallback for multi-device / phone verification)
  .post("/me/claim", rateLimit("RL_FORMS", { perHour: 10 }), async (c) => {
    const session = getSession(c);
    const db = c.get("db");

    // Check if user already owns a listing
    const existing = await db.query.merchants.findFirst({
      where: and(eq(merchants.ownerUserId, session.user.id), isNull(merchants.deletedAt)),
    });
    if (existing) {
      return c.json({ ok: true, data: { alreadyOwned: true, merchantId: existing.id } });
    }

    const rawBody = await c.req.json().catch(() => ({}));
    const parse = ClaimFallbackSchema.safeParse(rawBody);
    if (!parse.success) {
      throw new ApiError("VALIDATION_FAILED");
    }

    const { phone, claimToken } = parse.data;
    const now = Date.now();

    if (claimToken) {
      const [token, sig] = claimToken.split(".");
      if (token && sig) {
        const expectedSig = await hmacSha256Hex(c.env.CLAIM_TOKEN_SECRET, token);
        if (!safeEqual(sig, expectedSig)) {
          throw new ApiError("SIGNATURE_INVALID");
        }
      }
      const rawRawToken = token ?? claimToken;
      const hash = await sha256Hex(rawRawToken);

      const target = await db.query.merchants.findFirst({
        where: and(
          eq(merchants.claimTokenHash, hash),
          isNull(merchants.ownerUserId),
          isNull(merchants.claimRedeemedAt),
          isNull(merchants.deletedAt),
        ),
      });

      if (!target) {
        throw new ApiError("NOT_FOUND");
      }

      await db
        .update(merchants)
        .set({
          ownerUserId: session.user.id,
          claimRedeemedAt: new Date(now),
          updatedAt: new Date(now),
        })
        .where(eq(merchants.id, target.id));

      await db.insert(merchantLogs).values({
        id: `ml_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
        merchantId: target.id,
        event: "listing_claimed",
        meta: { claimedBy: session.user.id, method: "token" },
        createdAt: new Date(now),
      });

      return c.json({ ok: true, data: { claimed: true, merchantId: target.id } });
    }

    if (phone) {
      const normalized = normalizePhone(phone, ["mobile", "landline"]);
      if (!normalized) {
        throw new ApiError("INVALID_PHONE");
      }

      const target = await db.query.merchants.findFirst({
        where: and(
          eq(merchants.phone, normalized),
          isNull(merchants.ownerUserId),
          isNull(merchants.deletedAt),
        ),
      });

      if (!target) {
        throw new ApiError("NOT_FOUND");
      }

      await db
        .update(merchants)
        .set({
          ownerUserId: session.user.id,
          claimRedeemedAt: new Date(now),
          updatedAt: new Date(now),
        })
        .where(eq(merchants.id, target.id));

      await db.insert(merchantLogs).values({
        id: `ml_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
        merchantId: target.id,
        event: "listing_claimed",
        meta: { claimedBy: session.user.id, method: "phone" },
        createdAt: new Date(now),
      });

      return c.json({ ok: true, data: { claimed: true, merchantId: target.id } });
    }

    throw new ApiError("VALIDATION_FAILED");
  })

  // 4. GET /api/me/tickets
  .get("/me/tickets", async (c) => {
    const session = getSession(c);
    const db = c.get("db");

    const merchant = await db.query.merchants.findFirst({
      where: and(eq(merchants.ownerUserId, session.user.id), isNull(merchants.deletedAt)),
      columns: { id: true },
    });

    const conditions = [eq(feedbackTickets.reporterUserId, session.user.id)];
    if (merchant) {
      conditions.push(eq(feedbackTickets.reportedMerchantId, merchant.id));
    }

    const tickets = await db.query.feedbackTickets.findMany({
      where: or(...conditions),
      orderBy: [desc(feedbackTickets.createdAt)],
      columns: {
        id: true,
        publicNumber: true,
        type: true,
        title: true,
        status: true,
        adminResponseMd: true,
        adminRespondedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return c.json({ ok: true, data: { tickets } });
  })

  // 5. GET /api/me/donations
  .get("/me/donations", async (c) => {
    const session = getSession(c);
    const db = c.get("db");

    const merchant = await db.query.merchants.findFirst({
      where: and(eq(merchants.ownerUserId, session.user.id), isNull(merchants.deletedAt)),
      columns: { id: true },
    });

    const conditions = [eq(donations.userId, session.user.id)];
    if (merchant) {
      conditions.push(eq(donations.merchantId, merchant.id));
    }

    const userDonations = await db.query.donations.findMany({
      where: or(...conditions),
      orderBy: [desc(donations.createdAt)],
      columns: {
        id: true,
        referenceCode: true,
        amountCents: true,
        method: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
      },
    });

    return c.json({ ok: true, data: { donations: userDonations } });
  })

  // 6. PATCH /api/me/settings/language
  .patch("/me/settings/language", async (c) => {
    const session = getSession(c);
    const body = (await c.req.json().catch(() => ({}))) as { locale?: string };
    const locale = body?.locale;

    if (!locale || !LOCALES.includes(locale as Locale)) {
      throw new ApiError("VALIDATION_FAILED", { fields: { locale: "errors.INVALID_LOCALE" } });
    }

    const db = c.get("db");
    await db
      .update(users)
      .set({ locale: locale as Locale, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    setCookie(c, "NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 365 * 86400,
      sameSite: "Lax",
      httpOnly: false,
    });

    return c.json({ ok: true, data: { locale } });
  })

  // 7. DELETE /api/me/account
  .delete("/me/account", async (c) => {
    const session = getSession(c);
    const db = c.get("db");

    const merchant = await db.query.merchants.findFirst({
      where: and(eq(merchants.ownerUserId, session.user.id), isNull(merchants.deletedAt)),
    });

    if (!merchant) {
      throw new ApiError("NOT_FOUND");
    }

    const body = await c.req.json().catch(() => ({}));
    const parse = DeleteAccountSchema.safeParse(body);
    if (!parse.success || parse.data.confirmShopName !== merchant.shopName) {
      throw new ApiError("VALIDATION_FAILED", {
        fields: { confirmShopName: "errors.CONFIRMATION_MISMATCH" },
      });
    }

    const now = Date.now();

    // Soft delete merchant listing
    await db
      .update(merchants)
      .set({
        deletedAt: new Date(now),
        isPublicOnMap: false,
        updatedAt: new Date(now),
      })
      .where(eq(merchants.id, merchant.id));

    // Invalidate geo-cache so pin is removed
    await bumpGeoVersion(c.env.CACHE_KV, db);

    // Revoke all sessions for this user
    await db.delete(sessions).where(eq(sessions.userId, session.user.id));

    // Audit log
    await db.insert(merchantLogs).values({
      id: `ml_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      merchantId: merchant.id,
      event: "deleted",
      meta: { userId: session.user.id },
      createdAt: new Date(now),
    });

    return c.json({ ok: true });
  });
