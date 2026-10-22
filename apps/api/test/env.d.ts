import type { D1Migration } from "cloudflare:test";

declare global {
  namespace Cloudflare {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augments wrangler's Env by declaration merging
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
