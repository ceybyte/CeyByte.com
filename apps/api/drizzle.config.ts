import { defineConfig } from "drizzle-kit";

// 05-SCHEMA §4.3. Migrations are applied through wrangler; the d1-http driver is only for `db:studio` against remote.
export default defineConfig({
  dialect: "sqlite",
  schema: "../../packages/shared/src/db/schema.ts",
  out: "./drizzle",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    databaseId: process.env.CLOUDFLARE_D1_ID ?? "",
    token: process.env.CLOUDFLARE_D1_TOKEN ?? "",
  },
});
