import { Hono } from "hono";
import { and, desc, eq, like, sql } from "drizzle-orm";
import {
  FeedbackSubmitSchema,
  FeedbackQuerySchema,
  formatTicketNumber,
  parseTicketNumber,
} from "@cbpos/shared/schemas/feedback";
import { feedbackTickets, feedbackVotes, releases } from "@cbpos/shared/db/schema";
import { ApiError } from "../lib/errors";
import { rateLimit } from "../lib/ratelimit";
import { turnstile } from "../lib/turnstile";
import { clientIp } from "../lib/iphash";
import { sha256Hex } from "../lib/crypto";
import type { AppEnv } from "../types";

export const feedbackRoutes = new Hono<AppEnv>()
  /**
   * POST /api/feedback
   * Submits a feedback ticket (01-PRD §F-07, AC-07.1).
   */
  .post("/feedback", turnstile("feedback"), rateLimit("RL_FORMS", { perHour: 10 }), async (c) => {
    const raw = await c.req.json().catch(() => null);
    const parsed = FeedbackSubmitSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_FAILED");
    }

    const data = parsed.data;
    const isPublic = data.type === "bug" || data.type === "feature";
    const user = c.var.session?.user;
    const reporterUserId = user?.id ?? null;

    // Sequential public_number calculation
    const maxResult = await c.var.db
      .select({ maxNum: sql<number>`COALESCE(MAX(${feedbackTickets.publicNumber}), 0)` })
      .from(feedbackTickets)
      .get();
    const nextNumber = (maxResult?.maxNum ?? 0) + 1;

    const id = crypto.randomUUID();
    await c.var.db.insert(feedbackTickets).values({
      id,
      publicNumber: nextNumber,
      draftId: data.draftId ?? null,
      type: data.type,
      title: data.title,
      bodyMd: data.bodyMd,
      appVersion: data.appVersion ?? null,
      windowsVersion: data.windowsVersion ?? null,
      severity: data.severity ?? null,
      status: "open",
      isPublic,
      voteCount: 0,
      crashLogKey: data.crashLogKey ?? null,
      screenshotKey: data.screenshotKey ?? null,
      contactPrivate: data.contactPrivate ?? null,
      screenshotPublicKey: null,
      reporterUserId,
      reportedMerchantId: data.reportedMerchantId ?? null,
      duplicateOfId: null,
      resolvedInReleaseId: null,
      adminResponseMd: null,
      adminRespondedAt: null,
    });

    return c.json({
      ok: true,
      data: {
        id,
        publicNumber: nextNumber,
        formattedNumber: formatTicketNumber(nextNumber),
        status: "open",
        isPublic,
      },
    } as const);
  })

  /**
   * GET /api/feedback
   * Public board query filtering by type, status, and sort (01-PRD §F-07, AC-07.1).
   * Strictly omits crashLogKey, screenshotKey, and contactPrivate.
   */
  .get("/feedback", rateLimit("RL_READ"), async (c) => {
    const queryParams = {
      type: c.req.query("type") ?? "all",
      status: c.req.query("status") ?? "all",
      sort: c.req.query("sort") ?? "votes",
      page: c.req.query("page") ?? "1",
      pageSize: c.req.query("pageSize") ?? "20",
      search: c.req.query("search"),
    };

    const parsed = FeedbackQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      throw new ApiError("VALIDATION_FAILED");
    }

    const { type, status, sort, page, pageSize, search } = parsed.data;

    const conditions = [eq(feedbackTickets.isPublic, true)];
    if (type !== "all") {
      conditions.push(eq(feedbackTickets.type, type));
    }
    if (status !== "all") {
      conditions.push(eq(feedbackTickets.status, status));
    }
    if (search && search.trim().length > 0) {
      conditions.push(like(feedbackTickets.title, `%${search.trim()}%`));
    }

    const whereClause = and(...conditions);

    // Total count
    const totalRow = await c.var.db
      .select({ count: sql<number>`count(*)` })
      .from(feedbackTickets)
      .where(whereClause)
      .get();
    const total = totalRow?.count ?? 0;

    const orderBy =
      sort === "newest"
        ? [desc(feedbackTickets.createdAt)]
        : [desc(feedbackTickets.voteCount), desc(feedbackTickets.createdAt)];

    const offset = (page - 1) * pageSize;

    const rows = await c.var.db
      .select({
        id: feedbackTickets.id,
        publicNumber: feedbackTickets.publicNumber,
        type: feedbackTickets.type,
        title: feedbackTickets.title,
        bodyMd: feedbackTickets.bodyMd,
        appVersion: feedbackTickets.appVersion,
        windowsVersion: feedbackTickets.windowsVersion,
        severity: feedbackTickets.severity,
        status: feedbackTickets.status,
        voteCount: feedbackTickets.voteCount,
        screenshotPublicKey: feedbackTickets.screenshotPublicKey,
        duplicateOfId: feedbackTickets.duplicateOfId,
        resolvedInReleaseId: feedbackTickets.resolvedInReleaseId,
        releaseVersion: releases.version,
        adminResponseMd: feedbackTickets.adminResponseMd,
        adminRespondedAt: feedbackTickets.adminRespondedAt,
        createdAt: feedbackTickets.createdAt,
        updatedAt: feedbackTickets.updatedAt,
      })
      .from(feedbackTickets)
      .leftJoin(releases, eq(feedbackTickets.resolvedInReleaseId, releases.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset)
      .all();

    const items = rows.map((r) => ({
      ...r,
      formattedNumber: formatTicketNumber(r.publicNumber),
    }));

    return c.json({
      ok: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    } as const);
  })

  /**
   * GET /api/feedback/similar
   * Finds top 3 similar open tickets by title (01-PRD §FR-07.3).
   */
  .get("/feedback/similar", rateLimit("RL_READ"), async (c) => {
    const q = c.req.query("q")?.trim() ?? "";
    if (q.length < 2) {
      return c.json({ ok: true, data: [] } as const);
    }

    const rows = await c.var.db
      .select({
        id: feedbackTickets.id,
        publicNumber: feedbackTickets.publicNumber,
        title: feedbackTickets.title,
        status: feedbackTickets.status,
        voteCount: feedbackTickets.voteCount,
      })
      .from(feedbackTickets)
      .where(and(eq(feedbackTickets.isPublic, true), like(feedbackTickets.title, `%${q}%`)))
      .orderBy(desc(feedbackTickets.voteCount), desc(feedbackTickets.createdAt))
      .limit(3)
      .all();

    const data = rows.map((r) => ({
      ...r,
      formattedNumber: formatTicketNumber(r.publicNumber),
    }));

    return c.json({ ok: true, data } as const);
  })

  /**
   * GET /api/feedback/:number
   * Detail view for a public ticket by number (e.g. "CB-0142" or "142").
   * Strictly omits private fields.
   */
  .get("/feedback/:number", rateLimit("RL_READ"), async (c) => {
    const rawParam = c.req.param("number");
    const num = parseTicketNumber(rawParam);
    if (!num) {
      throw new ApiError("NOT_FOUND");
    }

    const row = await c.var.db
      .select({
        id: feedbackTickets.id,
        publicNumber: feedbackTickets.publicNumber,
        type: feedbackTickets.type,
        title: feedbackTickets.title,
        bodyMd: feedbackTickets.bodyMd,
        appVersion: feedbackTickets.appVersion,
        windowsVersion: feedbackTickets.windowsVersion,
        severity: feedbackTickets.severity,
        status: feedbackTickets.status,
        voteCount: feedbackTickets.voteCount,
        screenshotPublicKey: feedbackTickets.screenshotPublicKey,
        duplicateOfId: feedbackTickets.duplicateOfId,
        resolvedInReleaseId: feedbackTickets.resolvedInReleaseId,
        releaseVersion: releases.version,
        adminResponseMd: feedbackTickets.adminResponseMd,
        adminRespondedAt: feedbackTickets.adminRespondedAt,
        createdAt: feedbackTickets.createdAt,
        updatedAt: feedbackTickets.updatedAt,
        isPublic: feedbackTickets.isPublic,
      })
      .from(feedbackTickets)
      .leftJoin(releases, eq(feedbackTickets.resolvedInReleaseId, releases.id))
      .where(eq(feedbackTickets.publicNumber, num))
      .get();

    const user = c.var.session?.user;
    if (!row || (!row.isPublic && user?.role !== "admin")) {
      throw new ApiError("NOT_FOUND");
    }

    return c.json({
      ok: true,
      data: {
        id: row.id,
        publicNumber: row.publicNumber,
        type: row.type,
        title: row.title,
        bodyMd: row.bodyMd,
        appVersion: row.appVersion,
        windowsVersion: row.windowsVersion,
        severity: row.severity,
        status: row.status,
        voteCount: row.voteCount,
        screenshotPublicKey: row.screenshotPublicKey,
        duplicateOfId: row.duplicateOfId,
        resolvedInReleaseId: row.resolvedInReleaseId,
        releaseVersion: row.releaseVersion,
        adminResponseMd: row.adminResponseMd,
        adminRespondedAt: row.adminRespondedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        formattedNumber: formatTicketNumber(row.publicNumber),
      },
    } as const);
  })

  /**
   * POST /api/feedback/:number/vote
   * Casts a single vote on a ticket (01-PRD §FR-07.4, AC-07.2).
   * Double voting is prevented by composite primary key on (ticket_id, voter_key).
   */
  .post("/feedback/:number/vote", rateLimit("RL_VOTES"), async (c) => {
    const rawParam = c.req.param("number");
    const num = parseTicketNumber(rawParam);
    if (!num) {
      throw new ApiError("NOT_FOUND");
    }

    const ticket = await c.var.db
      .select({
        id: feedbackTickets.id,
        publicNumber: feedbackTickets.publicNumber,
        isPublic: feedbackTickets.isPublic,
        voteCount: feedbackTickets.voteCount,
      })
      .from(feedbackTickets)
      .where(eq(feedbackTickets.publicNumber, num))
      .get();

    if (!ticket || !ticket.isPublic) {
      throw new ApiError("NOT_FOUND");
    }

    const user = c.var.session?.user;
    let voterKey: string;
    if (user?.id) {
      voterKey = `u:${user.id}`;
    } else {
      const ip = clientIp(c.req.raw.headers);
      const ua = c.req.header("user-agent") ?? "unknown";
      const pepper = c.env.IP_HASH_PEPPER ?? "pepper";
      const hash = await sha256Hex(`${ip}:${ua}:${pepper}`);
      voterKey = `a:${hash}`;
    }

    const existingVote = await c.var.db
      .select({ ticketId: feedbackVotes.ticketId })
      .from(feedbackVotes)
      .where(and(eq(feedbackVotes.ticketId, ticket.id), eq(feedbackVotes.voterKey, voterKey)))
      .get();

    if (existingVote) {
      return c.json({
        ok: true,
        data: {
          voted: false,
          alreadyVoted: true,
          voteCount: ticket.voteCount,
        },
      } as const);
    }

    try {
      await c.var.db.insert(feedbackVotes).values({
        ticketId: ticket.id,
        voterKey,
      });

      const updated = await c.var.db
        .update(feedbackTickets)
        .set({
          voteCount: sql`${feedbackTickets.voteCount} + 1`,
        })
        .where(eq(feedbackTickets.id, ticket.id))
        .returning({ voteCount: feedbackTickets.voteCount })
        .get();

      return c.json({
        ok: true,
        data: {
          voted: true,
          alreadyVoted: false,
          voteCount: updated?.voteCount ?? ticket.voteCount + 1,
        },
      } as const);
    } catch {
      // Handles race condition when parallel duplicate inserts occur
      return c.json({
        ok: true,
        data: {
          voted: false,
          alreadyVoted: true,
          voteCount: ticket.voteCount,
        },
      } as const);
    }
  });
