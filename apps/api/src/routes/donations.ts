import { DonationCreateSchema, DonationSubmitSchema } from "@cbpos/shared";
import { donations, merchants } from "@cbpos/shared/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { safeEqual, sha256Hex, toHex } from "../lib/crypto";
import { getDonationPaymentOptions } from "../lib/donation-settings";
import { ApiError } from "../lib/errors";
import { verifyUpload } from "../lib/r2";
import { rateLimit } from "../lib/ratelimit";
import { turnstile } from "../lib/turnstile";
import type { AppEnv } from "../types";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateReferenceCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    const byte = bytes[i] ?? 0;
    code += ALPHABET[byte % ALPHABET.length];
  }
  return `CB-DN-${code}`;
}

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export const donationsRoutes = new Hono<AppEnv>()
  // 1. Public transparency summary (AC-11.2)
  .get("/donations/summary", async (c) => {
    const cached = await c.env.CACHE_KV.get<{
      monthlyTotalCents: number;
      totalSupportersCount: number;
      supporters: unknown[];
      paymentOptions: unknown[];
    }>("donations:summary", "json");

    if (cached) {
      return c.json({ ok: true, data: cached });
    }

    const db = c.get("db");
    const approvedRows = await db
      .select({
        id: donations.id,
        amountCents: donations.amountCents,
        displayName: donations.displayName,
        isAnonymous: donations.isAnonymous,
        publicMessage: donations.publicMessage,
        messageApproved: donations.messageApproved,
        showAmountPublicly: donations.showAmountPublicly,
        merchantId: donations.merchantId,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .where(eq(donations.status, "approved"))
      .orderBy(desc(donations.createdAt));

    const now = new Date();
    const currentYearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    let monthlyTotalCents = 0;
    for (const row of approvedRows) {
      const createdIso = (
        row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)
      ).toISOString();
      if (createdIso.startsWith(currentYearMonth)) {
        monthlyTotalCents += row.amountCents;
      }
    }

    const supporters = approvedRows.slice(0, 50).map((row) => {
      const createdIso = (
        row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)
      ).toISOString();
      return {
        id: row.id,
        displayName: row.isAnonymous ? "Anonymous Supporter" : row.displayName || "Community Supporter",
        month: createdIso.slice(0, 7),
        isMerchantSupporter: Boolean(row.merchantId),
        amountCents: row.showAmountPublicly ? row.amountCents : null,
        publicMessage: row.messageApproved ? row.publicMessage : null,
      };
    });

    const allOptions = await getDonationPaymentOptions(c.env.CACHE_KV, c.env);
    const paymentOptions = allOptions.filter((opt) => opt.isEnabled);

    const summaryData = {
      monthlyTotalCents,
      totalSupportersCount: approvedRows.length,
      supporters,
      paymentOptions,
    };

    c.executionCtx.waitUntil(
      c.env.CACHE_KV.put("donations:summary", JSON.stringify(summaryData), {
        expirationTtl: 600,
      }),
    );

    return c.json({ ok: true, data: summaryData });
  })

  // 2. Initiate donation (Step 1)
  .post("/donations", turnstile("donation"), rateLimit("RL_FORMS"), async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = DonationCreateSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_FAILED");
    }

    const db = c.get("db");

    // Check optional merchant linkage without leaking presence in response
    let merchantId: string | null = null;
    if (parsed.data.linkMerchantPhone) {
      const merchant = await db
        .select({ id: merchants.id })
        .from(merchants)
        .where(and(eq(merchants.phone, parsed.data.linkMerchantPhone), isNull(merchants.deletedAt)))
        .get();
      if (merchant) {
        merchantId = merchant.id;
      }
    }

    const sessionUser = c.get("session")?.user;
    const userId = sessionUser?.id ?? null;
    if (!merchantId && userId) {
      const userMerchant = await db
        .select({ id: merchants.id })
        .from(merchants)
        .where(and(eq(merchants.ownerUserId, userId), isNull(merchants.deletedAt)))
        .get();
      if (userMerchant) {
        merchantId = userMerchant.id;
      }
    }

    // Generate unique reference code
    let referenceCode = "";
    for (let i = 0; i < 5; i++) {
      const code = generateReferenceCode();
      const existing = await db
        .select({ id: donations.id })
        .from(donations)
        .where(eq(donations.referenceCode, code))
        .get();
      if (!existing) {
        referenceCode = code;
        break;
      }
    }

    if (!referenceCode) {
      throw new ApiError("INTERNAL");
    }

    const secret = generateSecret();
    const submitSecretHash = await sha256Hex(secret);

    const donationId = crypto.randomUUID();
    await db.insert(donations).values({
      id: donationId,
      referenceCode,
      method: "bank_transfer",
      amountCents: parsed.data.amountCents,
      currency: "LKR",
      displayName: parsed.data.displayName,
      isAnonymous: parsed.data.isAnonymous,
      publicMessage: parsed.data.publicMessage,
      messageApproved: false,
      showAmountPublicly: parsed.data.showAmountPublicly,
      contactPrivate: parsed.data.contactPrivate,
      submitSecretHash,
      merchantId,
      userId,
      status: "awaiting_payment",
    });

    setCookie(c, `cb_dn_${referenceCode}`, secret, {
      path: "/",
      maxAge: 14 * 24 * 3600,
      httpOnly: true,
      sameSite: "Lax",
      secure: c.env.ENVIRONMENT === "production",
    });

    const allOptions = await getDonationPaymentOptions(c.env.CACHE_KV, c.env);
    const paymentOptions = allOptions.filter((opt) => opt.isEnabled);

    return c.json(
      {
        ok: true,
        data: {
          referenceCode,
          amountCents: parsed.data.amountCents,
          status: "awaiting_payment",
          paymentOptions,
        },
      },
      201,
    );
  })

  // 3. Submit bank slip (Step 2)
  .post("/donations/:ref/submit", rateLimit("RL_FORMS"), async (c) => {
    const ref = c.req.param("ref");
    const db = c.get("db");

    const donation = await db.select().from(donations).where(eq(donations.referenceCode, ref)).get();

    if (!donation) {
      throw new ApiError("NOT_FOUND");
    }

    const cookieSecret = getCookie(c, `cb_dn_${ref}`);
    const sessionUser = c.get("session")?.user;

    let isAuthorized = false;
    if (cookieSecret) {
      const hash = await sha256Hex(cookieSecret);
      if (safeEqual(donation.submitSecretHash, hash)) {
        isAuthorized = true;
      }
    }
    if (
      !isAuthorized &&
      sessionUser &&
      (donation.userId === sessionUser.id || sessionUser.role === "admin")
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new ApiError("FORBIDDEN");
    }

    const raw = await c.req.json().catch(() => null);
    const parsed = DonationSubmitSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_FAILED");
    }

    const verified = await verifyUpload(c.env.UPLOADS, parsed.data.slipKey, "donation_slip");

    await db
      .update(donations)
      .set({
        slipKey: verified.key,
        slipMime: verified.mime,
        slipSize: verified.size,
        txnReference: parsed.data.txnReference ?? null,
        status: "pending_review",
        updatedAt: new Date(),
      })
      .where(eq(donations.referenceCode, ref));

    return c.json({
      ok: true,
      data: {
        referenceCode: ref,
        status: "pending_review",
      },
    });
  })

  // 4. Status resumption
  .get("/donations/:ref/status", async (c) => {
    const ref = c.req.param("ref");
    const db = c.get("db");

    const donation = await db.select().from(donations).where(eq(donations.referenceCode, ref)).get();

    if (!donation) {
      throw new ApiError("NOT_FOUND");
    }

    const cookieSecret = getCookie(c, `cb_dn_${ref}`);
    const sessionUser = c.get("session")?.user;

    let isAuthorized = false;
    if (cookieSecret) {
      const hash = await sha256Hex(cookieSecret);
      if (safeEqual(donation.submitSecretHash, hash)) {
        isAuthorized = true;
      }
    }
    if (
      !isAuthorized &&
      sessionUser &&
      (donation.userId === sessionUser.id || sessionUser.role === "admin")
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new ApiError("FORBIDDEN");
    }

    const allOptions = await getDonationPaymentOptions(c.env.CACHE_KV, c.env);
    const paymentOptions = allOptions.filter((opt) => opt.isEnabled);

    return c.json({
      ok: true,
      data: {
        referenceCode: donation.referenceCode,
        status: donation.status,
        amountCents: donation.amountCents,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
        paymentOptions,
      },
    });
  });
