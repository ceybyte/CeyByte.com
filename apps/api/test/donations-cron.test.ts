import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "../src/lib/db";
import { cleanupDonations } from "../src/scheduled";

describe("Donations Scheduled Cron Cleanup", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM donations").run();
  });

  it("cancels abandoned awaiting_payment donations older than 14 days", async () => {
    const db = makeDb(env.DB);
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 3600 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000);

    await env.DB.prepare(
      `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, created_at, updated_at)
       VALUES 
       ('d-old', 'CB-DN-OLD001', 'bank_transfer', 100000, 'awaiting_payment', 'hash1', ?, ?),
       ('d-recent', 'CB-DN-REC001', 'bank_transfer', 200000, 'awaiting_payment', 'hash2', ?, ?)`,
    )
      .bind(fifteenDaysAgo.getTime(), fifteenDaysAgo.getTime(), twoDaysAgo.getTime(), twoDaysAgo.getTime())
      .run();

    const result = await cleanupDonations(env, db);
    expect(result.cancelledCount).toBe(1);

    const oldRow = await env.DB.prepare("SELECT status FROM donations WHERE id = 'd-old'").first<{
      status: string;
    }>();
    expect(oldRow?.status).toBe("cancelled");

    const recentRow = await env.DB.prepare("SELECT status FROM donations WHERE id = 'd-recent'").first<{
      status: string;
    }>();
    expect(recentRow?.status).toBe("awaiting_payment");
  });

  it("purges R2 slip objects for rejected donations older than 90 days", async () => {
    const db = makeDb(env.DB);
    const ninetyFiveDaysAgo = new Date(Date.now() - 95 * 24 * 3600 * 1000);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1000);

    const oldSlipKey = "slips/CB-DN-REJOLD/slip.png";
    const recentSlipKey = "slips/CB-DN-REJREC/slip.png";

    await env.UPLOADS.put(oldSlipKey, new Uint8Array([1, 2, 3]));
    await env.UPLOADS.put(recentSlipKey, new Uint8Array([4, 5, 6]));

    await env.DB.prepare(
      `INSERT INTO donations (id, reference_code, method, amount_cents, status, submit_secret_hash, slip_key, slip_mime, slip_size, reviewed_at, created_at, updated_at)
       VALUES 
       ('d-rej-old', 'CB-DN-REJOLD', 'bank_transfer', 100000, 'rejected', 'hash1', ?, 'image/png', 3, ?, ?, ?),
       ('d-rej-rec', 'CB-DN-REJREC', 'bank_transfer', 200000, 'rejected', 'hash2', ?, 'image/png', 3, ?, ?, ?)`,
    )
      .bind(
        oldSlipKey,
        ninetyFiveDaysAgo.getTime(),
        ninetyFiveDaysAgo.getTime(),
        ninetyFiveDaysAgo.getTime(),
        recentSlipKey,
        tenDaysAgo.getTime(),
        tenDaysAgo.getTime(),
        tenDaysAgo.getTime(),
      )
      .run();

    const result = await cleanupDonations(env, db);
    expect(result.purgedSlipsCount).toBe(1);

    // Old slip object should be deleted from R2 and cleared in D1
    const oldSlipInR2 = await env.UPLOADS.get(oldSlipKey);
    expect(oldSlipInR2).toBeNull();

    const oldRow = await env.DB.prepare("SELECT slip_key FROM donations WHERE id = 'd-rej-old'").first<{
      slip_key: string | null;
    }>();
    expect(oldRow?.slip_key).toBeNull();

    // Recent rejected slip object should still exist in R2
    const recentSlipInR2 = await env.UPLOADS.get(recentSlipKey);
    expect(recentSlipInR2).not.toBeNull();

    const recentRow = await env.DB.prepare("SELECT slip_key FROM donations WHERE id = 'd-rej-rec'").first<{
      slip_key: string | null;
    }>();
    expect(recentRow?.slip_key).toBe(recentSlipKey);
  });
});
