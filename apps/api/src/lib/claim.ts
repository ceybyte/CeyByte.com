import type { Db } from "./db";
import { hmacSha256Hex, safeEqual, sha256Hex } from "./crypto";
import { log } from "./log";

export type ClaimResult = {
  claimed: boolean;
  merchantId?: string;
};

/**
 * Validates an HMAC-signed claim token and claims the unredeemed merchant for userId.
 * (01-PRD §FR-09.2, 02-TRD §5.1, 04-APP_FLOW §Flow 6)
 */
export async function claimListingFromCookie(
  env: Env,
  _db: Db,
  userId: string,
  cookieHeader: string | null,
): Promise<ClaimResult> {
  if (!cookieHeader) return { claimed: false };
  const match = /(?:^|;\s*)cb_claim=([^;]+)/.exec(cookieHeader);
  if (!match || !match[1]) return { claimed: false };

  const raw = decodeURIComponent(match[1]);
  const [claimToken, sig] = raw.split(".");
  if (!claimToken || !sig) return { claimed: false };

  const expectedSig = await hmacSha256Hex(env.CLAIM_TOKEN_SECRET, claimToken);
  if (!safeEqual(sig, expectedSig)) {
    log.warn("claim_invalid_signature", { claimToken });
    return { claimed: false };
  }

  const hash = await sha256Hex(claimToken);
  const now = Date.now();

  // Find unredeemed merchant matching this hash
  const merchant = await env.DB.prepare(
    "SELECT id, owner_user_id, claim_redeemed_at FROM merchants WHERE claim_token_hash = ? AND deleted_at IS NULL LIMIT 1",
  )
    .bind(hash)
    .first<{ id: string; owner_user_id: string | null; claim_redeemed_at: number | null }>();

  if (!merchant || merchant.owner_user_id || merchant.claim_redeemed_at) {
    return { claimed: false };
  }

  // Assign ownership and mark redeemed
  await env.DB.prepare(
    "UPDATE merchants SET owner_user_id = ?, claim_redeemed_at = ?, updated_at = ? WHERE id = ?",
  )
    .bind(userId, now, now, merchant.id)
    .run();

  // Write merchant log
  await env.DB.prepare(
    "INSERT INTO merchant_logs (id, merchant_id, event, meta, created_at) VALUES (?, ?, 'listing_claimed', ?, ?)",
  )
    .bind(
      `ml_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      merchant.id,
      JSON.stringify({ claimedBy: userId }),
      now,
    )
    .run();

  log.info("listing_claimed", { merchantId: merchant.id, userId });
  return { claimed: true, merchantId: merchant.id };
}
