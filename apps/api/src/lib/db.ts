import * as relations from "@cbpos/shared/db/relations";
import * as schema from "@cbpos/shared/db/schema";
import { drizzle } from "drizzle-orm/d1";
import { createMiddleware } from "hono/factory";

// 05-SCHEMA §4.2. One client per request; D1 bindings are request-scoped (CLAUDE.md §5.2).
export const makeDb = (d1: D1Database) => drizzle(d1, { schema: { ...schema, ...relations } });
export type Db = ReturnType<typeof makeDb>;

export const dbMiddleware = createMiddleware<{ Bindings: Env; Variables: { db: Db } }>(async (c, next) => {
  c.set("db", makeDb(c.env.DB));
  await next();
});
