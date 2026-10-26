import { expect, test } from "@playwright/test";
import { execSync } from "node:child_process";

function getLocalVerificationOtp(email: string): string {
  const cmd = `bunx wrangler d1 execute cbpos-db --local --command "SELECT value FROM verifications WHERE identifier LIKE '%${email}' ORDER BY created_at DESC LIMIT 1;" --json`;
  const output = execSync(cmd, { cwd: "apps/api", encoding: "utf-8" });
  const parsed = JSON.parse(output);
  const rawValue = parsed[0]?.results[0]?.value;
  if (!rawValue) throw new Error(`No verification OTP found for ${email}`);
  return rawValue.split(":")[0];
}

test.describe.serial("S10 Blog Engine & Admin Authoring (Phase 13 / AC-10.1 - AC-10.5)", () => {
  test("AC-10.1: Blog index renders in en, si, and ta with client-side tag filtering & green button rule", async ({
    page,
  }) => {
    // 1. Visit English blog index
    const responseEn = await page.goto("/en/blog");
    expect(responseEn?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");
    await expect(page.getByText(/Release notes in plain language/i)).toBeVisible();

    // Verify Single Green Button Rule: no element on /en/blog contains #39FF14
    const content = await page.content();
    const forbiddenHex = ["#", "39FF14"].join("");
    expect(content).not.toContain(forbiddenHex);
    expect(content).not.toContain(`bg-[${forbiddenHex}]`);

    // Tag Filter Bar test (role="tab")
    const allTab = page.getByRole("tab", { name: "All" });
    const taxTab = page.getByRole("tab", { name: "Tax" });
    const storiesTab = page.getByRole("tab", { name: /stories/i });

    await expect(allTab).toBeVisible();
    await expect(taxTab).toBeVisible();
    await expect(storiesTab).toBeVisible();

    // Initially multiple posts visible
    await expect(page.getByText("Why CB POS is Free Forever").first()).toBeVisible();
    await expect(page.getByText("How CB POS Works Out VAT and SSCL from MRP").first()).toBeVisible();

    // Click "Tax" tag filter
    await taxTab.click();
    await expect(page.getByText("How CB POS Works Out VAT and SSCL from MRP").first()).toBeVisible();
    await expect(page.getByText("Shop Story: Perera Grocery")).not.toBeVisible();

    // Reset to "All"
    await allTab.click();
    await expect(page.getByText("Shop Story: Perera Grocery").first()).toBeVisible();

    // 2. Visit Sinhala blog index
    const responseSi = await page.goto("/si/blog");
    expect(responseSi?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("බ්ලොග් අඩවිය");

    // 3. Visit Tamil blog index
    const responseTa = await page.goto("/ta/blog");
    expect(responseTa?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("வலைப்பதிவு");
  });

  test("AC-10.2: Article view renders custom directives, dual-tax table, and reading time", async ({
    page,
  }) => {
    const res = await page.goto("/en/blog/how-cb-pos-works-out-vat-and-sscl-from-mrp");
    expect(res?.status()).toBe(200);

    // Title and metadata
    await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(
      "How CB POS Works Out VAT and SSCL from MRP",
    );
    await expect(page.getByText(/min read/i).first()).toBeVisible();

    // Dual-tax extraction table math check
    await expect(page.getByText("Rs. 975.00").first()).toBeVisible();
    await expect(page.getByText("Rs. 25.00").first()).toBeVisible();
    await expect(page.getByText("Rs. 180.00").first()).toBeVisible();
    await expect(page.getByText("Rs. 1,180.00").first()).toBeVisible();

    // Keyboard shortcut directive check (:kbd[F3])
    const kbd = page.locator("kbd.kbd-key");
    await expect(kbd).toBeVisible();
    await expect(kbd).toHaveText("F3");

    // Callout / IRD tax disclaimer notice check
    await expect(page.getByText(/Inland Revenue Department \(IRD\) Notice/i).first()).toBeVisible();

    // Share buttons in footer
    await expect(page.getByRole("button", { name: /Copy link/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /WhatsApp/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /X \(Twitter\)|Twitter/i }).first()).toBeVisible();
  });

  test("AC-10.3: Missing translation renders English fallback with 'Also in English' banner", async ({
    page,
  }) => {
    // This post only exists in English
    const res = await page.goto("/si/blog/how-cb-pos-works-out-vat-and-sscl-from-mrp");
    expect(res?.status()).toBe(200);

    // Warning banner informs user article is in English
    await expect(page.getByRole("note", { name: "ඉංග්‍රීසි බසින්ද ඇත" })).toBeVisible();
    await expect(page.getByText(/මෙම ලිපිය දැනට ඉංග්‍රීසි භාෂාවෙන් පමණක් ලබා ගත හැක/i).first()).toBeVisible();

    // English article title and content render underneath
    await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(
      "How CB POS Works Out VAT and SSCL from MRP",
    );
    await expect(page.getByText("Rs. 975.00").first()).toBeVisible();

    // Check Sinhala blog index for "Also available in English" section
    await page.goto("/si/blog");
    await expect(page.getByRole("heading", { name: "ඉංග්‍රීසි බසින්ද ඇත" }).first()).toBeVisible();
    await expect(
      page
        .locator("article:has-text('How CB POS Works Out VAT and SSCL from MRP')")
        .locator("span:has-text('EN')")
        .first(),
    ).toBeVisible();
  });

  test("AC-10.4: Admin authoring portal, split-pane editor, and media presign security", async ({
    page,
    request,
  }) => {
    const adminEmail = `admin_blog_${Date.now()}@example.com`;

    // 1. Log in admin user
    await page.goto("/en/login");
    const emailInput = page.getByLabel(/Email/i);
    await emailInput.fill(adminEmail);
    await page.getByRole("button", { name: /Email me a sign-in code/i }).click();

    await page.locator("#otp-0").waitFor({ timeout: 10_000 });
    const otp = getLocalVerificationOtp(adminEmail);
    for (let i = 0; i < 6; i++) {
      await page.locator(`#otp-${i}`).fill(otp[i]);
    }
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(/\/en\/dashboard/, { timeout: 15_000 });

    // Elevate user to admin role in D1
    execSync(
      `bunx wrangler d1 execute cbpos-db --local --command "UPDATE users SET role = 'admin' WHERE email = '${adminEmail}';"`,
      { cwd: "apps/api" },
    );

    // 2. Visit /admin/blog
    await page.goto("/admin/blog");
    await expect(page.getByRole("heading", { name: "Blog Articles" }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: /New Article/i }).first()).toBeVisible();

    // 3. Test New Article split editor
    await page.goto("/admin/blog/new");
    await expect(page.getByRole("heading", { name: "New Article" }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Live Preview").first()).toBeVisible();

    // Typing in title auto-generates slug and updates preview
    const titleInput = page.getByPlaceholder("Article title...");
    await titleInput.fill("E2E Test Announcement");

    const slugInput = page.getByPlaceholder("url-slug");
    await expect(slugInput).toHaveValue("e2e-test-announcement");

    // Live preview contains the title
    await expect(page.getByRole("heading", { name: "E2E Test Announcement" }).first()).toBeVisible();

    // 4. Test Media Presign security (uses page.request with admin session cookie)
    // Disallowed executable file type rejected
    const badPresignRes = await page.request.post("/api/admin/media/presign", {
      data: {
        fileName: "malware.exe",
        contentType: "application/x-msdownload",
        size: 1024,
      },
    });
    expect(badPresignRes.status()).toBe(400);

    // Valid PNG image accepted
    const goodPresignRes = await page.request.post("/api/admin/media/presign", {
      data: {
        fileName: "cover.png",
        contentType: "image/png",
        size: 10240,
      },
    });
    expect(goodPresignRes.ok()).toBe(true);
    const goodPresignData = (await goodPresignRes.json()) as {
      ok: boolean;
      data: { uploadUrl: string; key: string };
    };
    expect(goodPresignData.data.key).toContain("media/blog/");
  });

  test("AC-10.5: RSS 2.0 XML feeds return valid standard syndication for all locales", async ({
    request,
  }) => {
    // English feed
    const resEn = await request.get("/en/blog/rss.xml");
    expect(resEn.status()).toBe(200);
    const xmlEn = await resEn.text();
    expect(xmlEn).toContain('<?xml version="1.0" encoding="UTF-8"');
    expect(xmlEn).toContain('<rss version="2.0"');
    expect(xmlEn).toContain("<channel>");
    expect(xmlEn).toContain("<title>CeyByte POS Blog</title>");
    expect(xmlEn).toContain("<item>");
    expect(xmlEn).toContain("<guid");

    // Sinhala feed
    const resSi = await request.get("/si/blog/rss.xml");
    expect(resSi.status()).toBe(200);
    const xmlSi = await resSi.text();
    expect(xmlSi).toContain('<rss version="2.0"');
    expect(xmlSi).toContain("<channel>");
    expect(xmlSi).toContain("බ්ලොග් අඩවිය");
  });
});
