import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page is served as static HTML with no accessibility violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/The Free POS for Sri Lankan Shops/i);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("API answers on the same origin", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ ok: true, data: { status: "ok" } });
});

test("home page navigation exposes merchant entry points", async ({ page, isMobile }) => {
  await page.goto("/en");

  // Footer contains Merchant portal link across all devices
  const merchantPortalLink = page.getByRole("contentinfo").getByRole("link", { name: "Merchant portal" });
  await expect(merchantPortalLink).toBeVisible();
  await expect(merchantPortalLink).toHaveAttribute("href", /\/en\/dashboard\/?/);

  if (isMobile) {
    const menuBtn = page.getByRole("banner").getByRole("button", { name: /open navigation menu/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    const signInBtn = page.getByRole("dialog").getByRole("link", { name: "Sign in" });
    await expect(signInBtn).toBeVisible();
    await expect(signInBtn).toHaveAttribute("href", /\/en\/login\/?/);
  } else {
    const signInBtn = page.getByRole("banner").getByRole("link", { name: "Sign in" });
    await expect(signInBtn).toBeVisible();
    await expect(signInBtn).toHaveAttribute("href", /\/en\/login\/?/);
  }
});
