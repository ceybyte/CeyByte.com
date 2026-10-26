import { Hono } from "hono";
import { z } from "zod";
import { and, count, desc, eq, like, or } from "drizzle-orm";
import { blogPosts } from "@cbpos/shared/db/schema";
import { processMarkdown, calculateReadingTime, extractPlainText } from "@cbpos/shared";
import { auditInsert } from "../lib/audit";
import { ApiError } from "../lib/errors";
import { presignPut } from "../lib/r2";
import { triggerRebuild } from "../lib/rebuild";
import type { AppEnv } from "../types";

const MB = 1024 * 1024;

const MEDIA_RULES: Record<string, { exts: string[]; maxBytes: number }> = {
  "image/jpeg": { exts: ["jpg", "jpeg"], maxBytes: 5 * MB },
  "image/png": { exts: ["png"], maxBytes: 5 * MB },
  "image/webp": { exts: ["webp"], maxBytes: 5 * MB },
  "video/mp4": { exts: ["mp4"], maxBytes: 50 * MB },
  "text/vtt": { exts: ["vtt"], maxBytes: 1 * MB },
};

const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(120),
  locale: z.enum(["en", "si", "ta"]),
  translationKey: z.string().min(1).max(120),
  excerpt: z.string().min(1).max(500),
  bodyMd: z.string().min(1),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "scheduled", "published", "archived"]).default("draft"),
  publishedAt: z.string().optional().nullable(),
  coverImageKey: z.string().optional().nullable(),
  coverAlt: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

const updatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(120).optional(),
  locale: z.enum(["en", "si", "ta"]).optional(),
  translationKey: z.string().min(1).max(120).optional(),
  excerpt: z.string().min(1).max(500).optional(),
  bodyMd: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  publishedAt: z.string().optional().nullable(),
  coverImageKey: z.string().optional().nullable(),
  coverAlt: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

const mediaPresignSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  size: z.number().int().positive(),
  postId: z.string().optional(),
});

export const adminBlogRoutes = new Hono<AppEnv>()
  // 1. List Posts with Filtering
  .get("/admin/blog/posts", async (c) => {
    const db = c.get("db");
    const status = c.req.query("status");
    const locale = c.req.query("locale");
    const search = c.req.query("search");
    const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
    const offset = Number(c.req.query("offset") ?? 0);

    const conditions = [];
    if (status) {
      conditions.push(eq(blogPosts.status, status as "draft" | "scheduled" | "published" | "archived"));
    }
    if (locale) {
      conditions.push(eq(blogPosts.locale, locale as "en" | "si" | "ta"));
    }
    if (search) {
      const searchCond = or(like(blogPosts.title, `%${search}%`), like(blogPosts.slug, `%${search}%`));
      if (searchCond) conditions.push(searchCond);
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(blogPosts)
        .where(whereClause)
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(blogPosts).where(whereClause),
    ]);

    return c.json({
      ok: true,
      data: {
        items,
        total: totalResult[0]?.count ?? 0,
      },
    });
  })

  // 2. Get Single Post
  .get("/admin/blog/posts/:id", async (c) => {
    const id = c.req.param("id");
    const db = c.get("db");

    const post = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
    if (!post) {
      throw new ApiError("NOT_FOUND");
    }

    return c.json({
      ok: true,
      data: post,
    });
  })

  // 3. Create Post
  .post("/admin/blog/posts", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: "VALIDATION_FAILED", details: parsed.error.format() }, 400);
    }

    const db = c.get("db");
    const user = c.get("session")?.user;
    const {
      title,
      slug,
      locale,
      translationKey,
      excerpt,
      bodyMd,
      tags,
      status,
      publishedAt,
      coverImageKey,
      coverAlt,
      seoTitle,
      seoDescription,
    } = parsed.data;

    // Check slug uniqueness per locale
    const existing = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(and(eq(blogPosts.locale, locale), eq(blogPosts.slug, slug)))
      .get();

    if (existing) {
      return c.json({ ok: false, error: "SLUG_ALREADY_EXISTS" }, 409);
    }

    const proc = await processMarkdown(bodyMd, { locale, highlight: false });
    const plainText = extractPlainText(bodyMd);
    const readingMinutes = calculateReadingTime(plainText);

    const id = crypto.randomUUID();
    const now = new Date();
    const pubDate = publishedAt ? new Date(publishedAt) : status === "published" ? now : null;

    await db.insert(blogPosts).values({
      id,
      translationKey,
      locale,
      slug,
      title,
      excerpt,
      bodyMd,
      bodyHast: proc.html,
      tocJson: proc.toc,
      coverImageKey: coverImageKey ?? null,
      coverAlt: coverAlt ?? null,
      tags,
      status,
      readingMinutes,
      seoTitle: seoTitle ?? null,
      seoDescription: seoDescription ?? null,
      authorId: user?.id ?? null,
      publishedAt: pubDate,
      createdAt: now,
      updatedAt: now,
    });

    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "post.create",
      entityType: "post",
      entityId: id,
      diff: {
        after: { id, title, slug, locale, status },
      },
    });

    return c.json(
      {
        ok: true,
        data: {
          id,
          slug,
          readingMinutes,
          status,
        },
      },
      201,
    );
  })

  // 4. Update Post
  .put("/admin/blog/posts/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: "VALIDATION_FAILED", details: parsed.error.format() }, 400);
    }

    const db = c.get("db");
    const user = c.get("session")?.user;

    const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
    if (!existing) {
      throw new ApiError("NOT_FOUND");
    }

    const updateData: Partial<typeof blogPosts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.excerpt !== undefined) updateData.excerpt = parsed.data.excerpt;
    if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;
    if (parsed.data.coverImageKey !== undefined) updateData.coverImageKey = parsed.data.coverImageKey;
    if (parsed.data.coverAlt !== undefined) updateData.coverAlt = parsed.data.coverAlt;
    if (parsed.data.seoTitle !== undefined) updateData.seoTitle = parsed.data.seoTitle;
    if (parsed.data.seoDescription !== undefined) updateData.seoDescription = parsed.data.seoDescription;
    if (parsed.data.translationKey !== undefined) updateData.translationKey = parsed.data.translationKey;

    const nextLocale = parsed.data.locale ?? existing.locale;
    const nextSlug = parsed.data.slug ?? existing.slug;

    if (parsed.data.slug !== undefined || parsed.data.locale !== undefined) {
      if (nextLocale !== existing.locale || nextSlug !== existing.slug) {
        const conflict = await db
          .select({ id: blogPosts.id })
          .from(blogPosts)
          .where(and(eq(blogPosts.locale, nextLocale), eq(blogPosts.slug, nextSlug)))
          .get();
        if (conflict && conflict.id !== id) {
          return c.json({ ok: false, error: "SLUG_ALREADY_EXISTS" }, 409);
        }
      }
      updateData.locale = nextLocale;
      updateData.slug = nextSlug;
    }

    if (parsed.data.bodyMd !== undefined) {
      const proc = await processMarkdown(parsed.data.bodyMd, { locale: nextLocale, highlight: false });
      const plainText = extractPlainText(parsed.data.bodyMd);
      updateData.bodyMd = parsed.data.bodyMd;
      updateData.bodyHast = proc.html;
      updateData.tocJson = proc.toc;
      updateData.readingMinutes = calculateReadingTime(plainText);
    }

    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
    }
    if (parsed.data.publishedAt !== undefined) {
      updateData.publishedAt = parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : null;
    }

    await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id));

    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "post.update",
      entityType: "post",
      entityId: id,
      diff: {
        before: { title: existing.title, status: existing.status },
        after: updateData,
      },
    });

    const updated = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();

    return c.json({
      ok: true,
      data: updated,
    });
  })

  // 5. Publish Post
  .post("/admin/blog/posts/:id/publish", async (c) => {
    const id = c.req.param("id");
    const db = c.get("db");
    const user = c.get("session")?.user;

    const post = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
    if (!post) {
      throw new ApiError("NOT_FOUND");
    }

    const now = new Date();
    const publishedAt = post.publishedAt || now;

    await db
      .update(blogPosts)
      .set({
        status: "published",
        publishedAt,
        updatedAt: now,
      })
      .where(eq(blogPosts.id, id));

    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "post.publish",
      entityType: "post",
      entityId: id,
      diff: {
        before: { status: post.status },
        after: { status: "published", publishedAt: publishedAt.toISOString() },
      },
    });

    await triggerRebuild(c.env, "admin_blog_publish");

    return c.json({
      ok: true,
      data: {
        status: "published",
        publishedAt: publishedAt.toISOString(),
      },
    });
  })

  // 6. Delete Post
  .delete("/admin/blog/posts/:id", async (c) => {
    const id = c.req.param("id");
    const db = c.get("db");
    const user = c.get("session")?.user;

    const post = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
    if (!post) {
      throw new ApiError("NOT_FOUND");
    }

    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    await auditInsert(db, {
      actorUserId: user?.id ?? null,
      action: "post.delete",
      entityType: "post",
      entityId: id,
      diff: {
        before: { title: post.title, slug: post.slug, locale: post.locale },
      },
    });

    return c.json({
      ok: true,
      data: { deleted: true },
    });
  })

  // 7. Admin Media Presigning
  .post("/admin/media/presign", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = mediaPresignSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ ok: false, error: "VALIDATION_FAILED" }, 400);
    }

    const { fileName, contentType, size, postId } = parsed.data;
    const rule = MEDIA_RULES[contentType];
    if (!rule) {
      return c.json({ ok: false, error: "FILE_TYPE_NOT_ALLOWED" }, 400);
    }

    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    if (!rule.exts.includes(ext)) {
      return c.json({ ok: false, error: "FILE_TYPE_NOT_ALLOWED" }, 400);
    }

    if (size > rule.maxBytes) {
      return c.json({ ok: false, error: "FILE_TOO_LARGE" }, 400);
    }

    const safePostId = (postId || "general").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileUuid = crypto.randomUUID();
    const key = `media/blog/${safePostId}/${fileUuid}.${ext}`;
    const expiresSec = 300;
    const uploadUrl = await presignPut(c.env, key, contentType, expiresSec);

    return c.json({
      ok: true,
      data: {
        uploadUrl,
        key,
        expiresAt: Date.now() + expiresSec * 1000,
      },
    });
  });
