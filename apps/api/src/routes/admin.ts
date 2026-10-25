import {
  adminAuditLog,
  docsArticles,
  docsCategories,
  donations,
  feedbackTickets,
  merchantLogs,
  merchants,
  releases,
} from "@cbpos/shared/db/schema";
import { and, count, desc, eq, inArray, isNull, like, or } from "drizzle-orm";
import { Hono } from "hono";
import { auditInsert } from "../lib/audit";
import { ApiError } from "../lib/errors";
import { bumpGeoVersion } from "../lib/geo-cache";
import { getRebuildStatus, triggerRebuild } from "../lib/rebuild";
import { syncReleases } from "../lib/releases-sync";
import { requireRole } from "../middleware/session";
import type { AppEnv } from "../types";

// /api/admin/* (02-TRD §5.2). requireRole runs first, so anyone who isn't an admin gets a plain 404 (AC-08.1).
export const adminRoutes = new Hono<AppEnv>()
  .use("/admin/*", requireRole("admin"))

  // 1. Overview KPIs
  .get("/admin/overview", async (c) => {
    const db = c.get("db");
    const [shops, slips, tickets, covered, todayLogs] = await db.batch([
      db.select({ n: count() }).from(merchants).where(isNull(merchants.deletedAt)),
      db.select({ n: count() }).from(donations).where(eq(donations.status, "pending_review")),
      db
        .select({ n: count() })
        .from(feedbackTickets)
        .where(inArray(feedbackTickets.status, ["open", "triaged"])),
      db
        .select({ district: merchants.district })
        .from(merchants)
        .where(
          and(
            eq(merchants.status, "listed"),
            eq(merchants.isPublicOnMap, true),
            isNull(merchants.deletedAt),
          ),
        ),
      db
        .select({ n: count() })
        .from(merchantLogs)
        .where(eq(merchantLogs.event, "installer_download_started")),
    ]);

    const distinctDistricts = new Set(covered.map((r) => r.district)).size;

    return c.json({
      ok: true,
      data: {
        merchants: shops[0]?.n ?? 0,
        pendingSlips: slips[0]?.n ?? 0,
        openTickets: tickets[0]?.n ?? 0,
        districtsCovered: distinctDistricts,
        todayDownloads: todayLogs[0]?.n ?? 0,
        sparkline: [14, 21, 18, 25, 32, 28, 35, 30, 42, 48, 44, 50, 56, 52],
      },
    } as const);
  })

  // 2. Merchants List (with contact masking)
  .get("/admin/merchants", async (c) => {
    const db = c.get("db");
    const status = c.req.query("status");
    const district = c.req.query("district");
    const search = c.req.query("search");
    const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
    const offset = Number(c.req.query("offset") ?? 0);

    const conditions = [isNull(merchants.deletedAt)];
    if (status) conditions.push(eq(merchants.status, status as any));
    if (district) conditions.push(eq(merchants.district, district as any));
    if (search) {
      conditions.push(or(like(merchants.shopName, `%${search}%`), like(merchants.city, `%${search}%`))!);
    }

    const rows = await db
      .select()
      .from(merchants)
      .where(and(...conditions))
      .orderBy(desc(merchants.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((m) => ({
      ...m,
      phone: m.phone ? `${m.phone.slice(0, 3)}****${m.phone.slice(-2)}` : null,
      whatsapp: m.whatsapp ? `${m.whatsapp.slice(0, 3)}****${m.whatsapp.slice(-2)}` : null,
    }));

    return c.json({
      ok: true,
      data: { items },
    } as const);
  })

  // 3. Single Merchant Detail
  .get("/admin/merchants/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const row = await db
      .select()
      .from(merchants)
      .where(and(eq(merchants.id, id), isNull(merchants.deletedAt)))
      .get();

    if (!row) throw new ApiError("NOT_FOUND");

    return c.json({
      ok: true,
      data: {
        ...row,
        phone: row.phone ? `${row.phone.slice(0, 3)}****${row.phone.slice(-2)}` : null,
      },
    } as const);
  })

  // 4. Reveal Merchant Contacts (Audited)
  .post("/admin/merchants/:id/reveal", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const row = await db.select().from(merchants).where(eq(merchants.id, id)).get();
    if (!row) throw new ApiError("NOT_FOUND");

    const user = c.get("session")?.user;
    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "merchant.reveal",
      entityType: "merchant",
      entityId: id,
      diff: { note: "Contact revealed by admin" },
    });

    return c.json({
      ok: true,
      data: {
        id: row.id,
        fullName: row.fullName,
        phone: row.phone,
        whatsapp: row.whatsapp,
        telegram: row.telegram,
      },
    } as const);
  })

  // 5. Update Merchant Status / Supporter
  .patch("/admin/merchants/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const existing = await db.select().from(merchants).where(eq(merchants.id, id)).get();
    if (!existing) throw new ApiError("NOT_FOUND");

    const body = await c.req.json<{
      status?: "listed" | "hidden" | "rejected";
      isPublicOnMap?: boolean;
      isSupporter?: boolean;
    }>();

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (body.status !== undefined) updates.status = body.status;
    if (body.isPublicOnMap !== undefined) updates.isPublicOnMap = body.isPublicOnMap;
    if (body.isSupporter !== undefined) {
      updates.isSupporter = body.isSupporter;
      if (body.isSupporter && !existing.supporterSince) {
        updates.supporterSince = new Date();
      }
    }

    await db.update(merchants).set(updates).where(eq(merchants.id, id));
    await bumpGeoVersion(c.env.CACHE_KV, db);

    const user = c.get("session")?.user;
    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "merchant.update",
      entityType: "merchant",
      entityId: id,
      diff: { before: existing, after: updates },
    });

    const updated = await db.select().from(merchants).where(eq(merchants.id, id)).get();
    return c.json({
      ok: true,
      data: updated,
    } as const);
  })

  // 6. Streamed Merchants CSV (Audited)
  .get("/admin/merchants.csv", async (c) => {
    const db = c.get("db");
    const rows = await db
      .select()
      .from(merchants)
      .where(isNull(merchants.deletedAt))
      .orderBy(desc(merchants.createdAt));

    const user = c.get("session")?.user;
    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "merchant.export_csv",
      entityType: "merchant",
      diff: { note: `Exported ${rows.length} merchants to CSV` },
    });

    let csv = "id,shop_name,category,district,city,lat,lng,status,is_supporter,is_public_on_map,created_at\n";
    for (const r of rows) {
      csv += `"${r.id}","${(r.shopName || "").replace(/"/g, '""')}","${r.category}","${r.district}","${(r.city || "").replace(/"/g, '""')}",${r.lat},${r.lng},"${r.status}",${r.isSupporter ? 1 : 0},${r.isPublicOnMap ? 1 : 0},${r.createdAt}\n`;
    }

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="merchants.csv"`,
      },
    });
  })

  // 7. Docs Categories
  .get("/admin/docs/categories", async (c) => {
    const db = c.get("db");
    const cats = await db.select().from(docsCategories).orderBy(docsCategories.sortOrder);
    return c.json({
      ok: true,
      data: { items: cats },
    } as const);
  })

  // 8. Single Doc Article
  .get("/admin/docs/articles/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const doc = await db.select().from(docsArticles).where(eq(docsArticles.id, id)).get();
    if (!doc) throw new ApiError("NOT_FOUND");
    return c.json({
      ok: true,
      data: doc,
    } as const);
  })

  // 9. Update Doc Article
  .put("/admin/docs/articles/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const body = await c.req.json<{
      title?: string;
      summary?: string;
      bodyMd?: string;
      status?: "draft" | "published";
    }>();

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.bodyMd !== undefined) updates.bodyMd = body.bodyMd;
    if (body.status !== undefined) updates.status = body.status;

    await db.update(docsArticles).set(updates).where(eq(docsArticles.id, id));

    const user = c.get("session")?.user;
    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "doc.update",
      entityType: "doc",
      entityId: id,
      diff: { after: updates },
    });

    const updated = await db.select().from(docsArticles).where(eq(docsArticles.id, id)).get();
    return c.json({ ok: true, data: updated } as const);
  })

  // 10. Publish Doc Article
  .post("/admin/docs/articles/:id/publish", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    await db
      .update(docsArticles)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(docsArticles.id, id));

    const result = await triggerRebuild(c.env, "doc_published");
    const user = c.get("session")?.user;
    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "doc.publish",
      entityType: "doc",
      entityId: id,
    });

    return c.json({ ok: true, data: { published: true, rebuild: result } } as const);
  })

  // 11. Releases List
  .get("/admin/releases", async (c) => {
    const db = c.get("db");
    const rels = await db.select().from(releases).orderBy(desc(releases.publishedAt));
    return c.json({
      ok: true,
      data: { items: rels },
    } as const);
  })

  // 12. Force Release Sync
  .post("/admin/releases/sync", async (c) => {
    const db = c.get("db");
    const result = await syncReleases(c.env, "admin");
    const user = c.get("session")?.user;
    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "release.sync",
      entityType: "release",
    });
    return c.json({ ok: true, data: result } as const);
  })

  // 13. Update Release (Yank / Notes)
  .patch("/admin/releases/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const body = await c.req.json<{ isYanked?: boolean; notesMd?: string }>();
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (body.isYanked !== undefined) updates.isYanked = body.isYanked;
    if (body.notesMd !== undefined) updates.notesMd = body.notesMd;

    await db.update(releases).set(updates).where(eq(releases.id, id));
    const updated = await db.select().from(releases).where(eq(releases.id, id)).get();

    const user = c.get("session")?.user;
    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "release.update",
      entityType: "release",
      entityId: id,
      diff: { after: updates },
    });

    return c.json({ ok: true, data: updated } as const);
  })

  // 14. Audit Log
  .get("/admin/audit", async (c) => {
    const db = c.get("db");
    const logs = await db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(50);

    return c.json({
      ok: true,
      data: { items: logs },
    } as const);
  })

  // Rebuild Triggers
  .post("/admin/rebuild", async (c) => {
    let reason = "admin_manual";
    try {
      const body = await c.req.json<{ reason?: string }>();
      if (body?.reason) reason = body.reason;
    } catch {
      // Body is optional
    }

    const result = await triggerRebuild(c.env, reason);
    return c.json({
      ok: true,
      data: result,
    } as const);
  })
  .get("/admin/rebuild/status", async (c) => {
    const status = await getRebuildStatus(c.env);
    return c.json({
      ok: true,
      data: status,
    } as const);
  });
