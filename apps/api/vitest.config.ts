import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Tests run inside workerd with the bindings from wrangler.jsonc (simulated locally by Miniflare). Secrets are
// fixed test values here because CI has no .dev.vars; test/setup.ts applies the D1 migrations.
export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations("./drizzle"),
          ENVIRONMENT: "test",
          SITE_URL: "http://localhost:3000",
          BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-00",
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          IP_HASH_PEPPER: "test-pepper",
          CLAIM_TOKEN_SECRET: "test-claim",
          GITHUB_WEBHOOK_SECRET: "test-webhook",
          GOOGLE_CLIENT_ID: "",
          GOOGLE_CLIENT_SECRET: "",
          RESEND_API_KEY: "",
          R2_ACCESS_KEY_ID: "",
          R2_SECRET_ACCESS_KEY: "",
          GITHUB_DISPATCH_TOKEN: "",
          GITHUB_API_TOKEN: "",
        },
      },
    })),
  ],
  test: { setupFiles: ["./test/setup.ts"] },
});
