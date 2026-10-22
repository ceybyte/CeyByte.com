import { donations, feedbackTickets, merchants } from "@cbpos/shared/db/schema";
import { count, eq, inArray, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { requireRole } from "../middleware/session";
import type { AppEnv } from "../types";

// /api/admin/* (02-TRD §5.2). requireRole runs first, so anyone who isn't an admin gets a plain 404.
export const adminRoutes = new Hono<AppEnv>()
  .use("/admin/*", requireRole("admin"))
  .get("/admin/overview", async (c) => {
    const db = c.get("db");
    const [shops, slips, tickets] = await db.batch([
      db.select({ n: count() }).from(merchants).where(isNull(merchants.deletedAt)),
      db.select({ n: count() }).from(donations).where(eq(donations.status, "pending_review")),
      db
        .select({ n: count() })
        .from(feedbackTickets)
        .where(inArray(feedbackTickets.status, ["open", "triaged"])),
    ]);
    return c.json({
      ok: true,
      data: { merchants: shops[0]?.n ?? 0, pendingSlips: slips[0]?.n ?? 0, openTickets: tickets[0]?.n ?? 0 },
    } as const);
  });
