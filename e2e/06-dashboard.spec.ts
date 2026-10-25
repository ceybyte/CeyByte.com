import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { execSync } from "node:child_process";

function getLocalVerificationOtp(email: string): string {
  const cmd = `bunx wrangler d1 execute cbpos-db --local --command "SELECT value FROM verifications WHERE identifier LIKE '%${email}' ORDER BY created_at DESC LIMIT 1;" --json`;
  const output = execSync(cmd, { cwd: "apps/api", encoding: "utf-8" });
  const parsed = JSON.parse(output);
  const rawValue = parsed[0]?.results[0]?.value;
  if (!rawValue) throw new Error(`No verification OTP found for ${email}`);
  return rawValue.split(":")[0];
}

test.describe.serial("Merchant Dashboard & Ownership Lifecycle (F-09 / AC-09.1 & AC-09.2)", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  const timestamp = Date.now();
  const shopName = `E2E Hardware ${timestamp}`;
  const ownerEmail = `e2e_owner_${timestamp}@example.com`;
  const ownerPhone = `077${Math.floor(1000000 + Math.random() * 9000000)}`;
  let claimCookieHeader = "";

  test("Step 1: Download gate sets HMAC-signed cb_claim cookie", async ({ request }) => {
    const res = await request.post("/api/downloads", {
      headers: {
        "cf-connecting-ip": `203.0.113.${(timestamp % 250) + 1}`,
      },
      data: {
        fullName: "Bandara Silva",
        shopName,
        category: "hardware",
        phone: ownerPhone,
        district: "kandy",
        city: "Peradeniya",
        lat: 7.26,
        lng: 80.59,
        locationSource: "pin",
        isPublicOnMap: true,
        termsAccepted: true,
        termsVersion: "2026-10-01",
        preferredLocale: "en",
        turnstileToken: "1x00000000000000000000AA",
      },
    });

    if (!res.ok()) {
      console.error("Downloads failed:", res.status(), await res.text());
    }
    expect(res.ok()).toBe(true);
    const setCookieHeaders = res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
    const claimCookie = setCookieHeaders.find((h) => h.value.includes("cb_claim="));
    expect(claimCookie).toBeDefined();

    const match = /cb_claim=([^;]+)/.exec(claimCookie?.value ?? "");
    expect(match).toBeTruthy();
    claimCookieHeader = match ? match[1] : "";
  });

  test("Step 2 & 3: Sign-in automatically claims merchant listing via cb_claim cookie (AC-09.1)", async () => {
    expect(claimCookieHeader).toBeTruthy();

    // Set cb_claim cookie on browser context for the preview origin
    await context.addCookies([
      {
        name: "cb_claim",
        value: claimCookieHeader,
        url: "http://localhost:8787",
      },
    ]);

    // Navigate to login with claim context
    await page.goto("/en/login?claim=1");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Verify claim context banner appears
    await expect(
      page.getByText(/Create an account to look after your shop's listing on the CB POS map/i),
    ).toBeVisible();

    // Fill email
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.fill(ownerEmail);

    // Click "Email me a sign-in code"
    await page.getByRole("button", { name: /Email me a sign-in code/i }).click();

    // Expect OTP boxes to appear
    const otp0 = page.locator("#otp-0");
    await expect(otp0).toBeVisible({ timeout: 10_000 });

    // Retrieve OTP from local D1
    const otp = getLocalVerificationOtp(ownerEmail);
    expect(otp).toHaveLength(6);

    // Enter digits into 6 input boxes
    for (let i = 0; i < 6; i++) {
      await page.locator(`#otp-${i}`).fill(otp[i]);
    }

    // Submit OTP
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Verify redirect to dashboard
    await page.waitForURL(/\/en\/dashboard/, { timeout: 15_000 });

    // Shop name and live status pill must be visible
    await expect(page.getByText(shopName)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Shown on the map")).toBeVisible();
    await expect(page.getByText("Peradeniya, Kandy")).toBeVisible();
  });

  test("Step 4: Owner can toggle public map visibility live", async () => {
    await page.goto("/en/dashboard");
    await expect(page.getByText(shopName)).toBeVisible({ timeout: 10_000 });

    // Find the visibility toggle button (initially "Hide from map")
    const hideBtn = page.getByRole("button", { name: /Hide from map/i });
    await expect(hideBtn).toBeVisible();

    // Click toggle to turn off visibility
    await hideBtn.click();
    await expect(page.getByText("Not shown on the map")).toBeVisible({ timeout: 10_000 });

    // Find the restore visibility button ("Show on map")
    const showBtn = page.getByRole("button", { name: /Show on map/i });
    await expect(showBtn).toBeVisible();

    // Click toggle to restore visibility
    await showBtn.click();
    await expect(page.getByText("Shown on the map")).toBeVisible({ timeout: 10_000 });
  });

  test("Step 5: Access isolation prevents foreign user from viewing or editing listing (AC-09.2)", async ({
    request,
  }) => {
    // Unauthenticated GET /api/me/listing must return 401
    const resUnauth = await request.get("/api/me/listing");
    expect(resUnauth.status()).toBe(401);

    // Unauthenticated PATCH /api/me/listing must return 401
    const resPatchUnauth = await request.patch("/api/me/listing", {
      data: { shopName: "Hacked Store" },
    });
    expect(resPatchUnauth.status()).toBe(401);
  });

  test("Step 6: Owner can delete listing and account from Settings Danger Zone", async () => {
    await page.goto("/en/dashboard/settings");
    await expect(page.getByText(/Delete my listing and account/i)).toBeVisible({ timeout: 10_000 });

    // Click Delete permanently trigger button to open modal
    await page.getByRole("button", { name: /Delete permanently/i }).click();

    // Modal opens asking to type shop name
    const confirmInput = page.getByPlaceholder(shopName);
    await expect(confirmInput).toBeVisible();

    // Confirm button is initially disabled
    const modalDeleteBtn = page.getByRole("dialog").getByRole("button", { name: /Delete permanently/i });
    await expect(modalDeleteBtn).toBeDisabled();

    // Type exact shop name
    await confirmInput.fill(shopName);
    await expect(modalDeleteBtn).toBeEnabled();

    // Click modal delete
    await modalDeleteBtn.click();

    // Verify redirected away from dashboard to home page
    await page.waitForURL(/\/(en)?$/, { timeout: 15_000 });

    // Attempting to visit /en/dashboard now redirects to login
    await page.goto("/en/dashboard");
    await page.waitForURL(/\/en\/login/, { timeout: 10_000 });
  });
});
