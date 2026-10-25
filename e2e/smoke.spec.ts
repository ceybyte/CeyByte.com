import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page is served as static HTML with no accessibility violations", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Keep billing when the internet goes down/i,
  );

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("API answers on the same origin", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ ok: true, data: { status: "ok" } });
});
