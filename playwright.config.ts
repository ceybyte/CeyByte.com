import { defineConfig, devices } from "@playwright/test";

// E2E runs against the production-like preview: static export + Worker on one origin (CLAUDE.md §3).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:8787",
    trace: "on-first-retry",
    // Locally, PW_CHANNEL=chrome uses the installed Google Chrome (Playwright's Chromium needs macOS 14+).
    ...(process.env.PW_CHANNEL && { channel: process.env.PW_CHANNEL }),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "bun run preview",
    url: "http://localhost:8787/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
