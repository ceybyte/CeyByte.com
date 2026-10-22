import type { Db } from "./lib/db";
import type { AuthSession } from "./lib/auth";

// Hono context for every route: bindings from wrangler types, per-request variables set by middleware.
export type AppEnv = {
  Bindings: Env;
  Variables: {
    requestId: string;
    db: Db;
    /** Set by `sessionMiddleware`; null when signed out. */
    session: AuthSession | null;
  };
};
