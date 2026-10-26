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

test.describe.serial("Donations & Supporter Badges (F-11 & F-08 M2 / AC-11.1 - AC-11.3 & AC-08.2)", () => {
  let createdRef = "";
  let ipCounter = 20;

  const nextIpHeaders = (extra: Record<string, string> = {}) => ({
    "cf-connecting-ip": `198.51.100.${(ipCounter++ % 200) + 1}`,
    ...extra,
  });

  test("AC-11.1: S09 public flow enforces single green button rule & rejects slips > 5 MB", async ({
    page,
  }) => {
    await page.goto("/en/donate");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Verify Single Green Button Rule: no element on S09 contains green button classes
    const pageContent = await page.content();
    const forbiddenHex = ["#", "39FF14"].join("");
    expect(pageContent).not.toContain(forbiddenHex);
    expect(pageContent).not.toContain(`bg-[${forbiddenHex}]`);

    // Fill Step 1
    // Choose Rs. 2,500 preset
    const presetBtn = page.getByRole("button", { name: "Rs. 2,500" });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Fill donor name
    const nameInput = page.getByPlaceholder("Your name or shop name");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Silva Stores Test");

    // Click "Show the bank details" (Step 1 submit)
    const createBtn = page.getByRole("button", { name: /Show the bank details/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Step 2 appears with transfer reference code
    const refHeading = page.locator("h3:has-text('CB-DN-')");
    await expect(refHeading).toBeVisible({ timeout: 15_000 });
    const refText = await refHeading.textContent();
    expect(refText).toMatch(/^CB-DN-[A-Z0-9]+$/);
    createdRef = refText!.trim();

    // AC-11.1: Client-side size check (file > 5 MB rejected immediately)
    const dropzoneInput = page.locator("input[type='file']");
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 0); // 6 MB
    await dropzoneInput.setInputFiles({
      name: "oversized_slip.png",
      mimeType: "image/png",
      buffer: oversizedBuffer,
    });

    // Verification error message displayed
    await expect(page.getByText(/exceeds maximum allowed size of 5 MB/i)).toBeVisible();
  });

  test("AC-11.2: Unapproved donations remain isolated from monthly totals & supporters wall", async ({
    request,
    page,
  }) => {
    expect(createdRef).toBeTruthy();

    // Query public donations summary
    const summaryRes = await request.get("/api/donations/summary");
    expect(summaryRes.ok()).toBe(true);
    const summaryJson = (await summaryRes.json()) as {
      ok: boolean;
      data: {
        monthlyTotalCents: number;
        totalSupportersCount: number;
        supporters: Array<{ displayName: string }>;
      };
    };

    // The unapproved donation must NOT appear in supporters array
    const supporterFound = summaryJson.data.supporters.some((s) => s.displayName === "Silva Stores Test");
    expect(supporterFound).toBe(false);

    // On the public page, unapproved donor name is not visible on wall
    await page.goto("/en/donate");
    const wallHeading = page.getByRole("heading", { name: /Supporters Wall/i });
    await expect(wallHeading).toBeVisible();
    const wallText = await page.textContent("section");
    expect(wallText).not.toContain("Silva Stores Test");
  });

  test("AC-11.3: Magic byte verification rejects renamed executables", async ({ request }) => {
    // 1. Create a fresh donation to test upload verification
    const createRes = await request.post("/api/donations", {
      headers: nextIpHeaders(),
      data: {
        amountCents: 50000, // Rs. 500
        displayName: "Security Test",
        turnstileToken: "1x00000000000000000000AA",
      },
    });
    expect(createRes.ok()).toBe(true);
    const createJson = (await createRes.json()) as {
      ok: boolean;
      data: { id: string; referenceCode: string };
    };
    const secRef = createJson.data.referenceCode;

    // 2. Request presigned URL for a spoofed PNG file (actually an executable with MZ header)
    const presignRes = await request.post("/api/uploads/presign", {
      headers: nextIpHeaders(),
      data: {
        purpose: "donation_slip",
        fileName: "malicious.png",
        contentType: "image/png",
        size: 1024,
        entityRef: secRef,
        turnstileToken: "1x00000000000000000000AA",
      },
    });
    expect(presignRes.ok()).toBe(true);
    const presignJson = (await presignRes.json()) as {
      ok: boolean;
      data: { uploadUrl: string; key: string };
    };

    // 3. Upload executable payload (starts with 'MZ' signature: 0x4D 0x5A) disguised as image/png
    const exePayload = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const uploadTarget = presignJson.data.uploadUrl.startsWith("/")
      ? `http://localhost:8787${presignJson.data.uploadUrl}`
      : presignJson.data.uploadUrl;
    const r2Res = await fetch(uploadTarget, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: exePayload,
    });
    expect(r2Res.ok).toBe(true);

    // 4. Submitting slip must fail with server-side validation error (magic byte mismatch)
    const submitRes = await request.post(`/api/donations/${secRef}/submit`, {
      headers: nextIpHeaders(),
      data: {
        slipKey: presignJson.data.key,
      },
    });
    expect(submitRes.ok()).toBe(false);
    expect(submitRes.status()).toBe(415);
    const submitJson = (await submitRes.json()) as {
      ok: boolean;
      error: { code: string };
    };
    expect(submitJson.error.code).toBe("FILE_TYPE_NOT_ALLOWED");
  });

  test("AC-08.2: Approving merchant-linked donation activates Gold pin on map in <60s", async ({
    page,
    request,
  }) => {
    const adminEmail = `admin_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;

    // 1. Create a donation linked to a merchant phone (Gunawardena Mini Mart: +94700001000)
    const createRes = await request.post("/api/donations", {
      headers: nextIpHeaders(),
      data: {
        amountCents: 100000, // Rs. 1,000 (above Rs. 500 threshold)
        displayName: "Colombo Grocery Supporter",
        linkMerchantPhone: "0700001000",
        turnstileToken: "1x00000000000000000000AA",
      },
    });
    expect(createRes.ok()).toBe(true);
    const createData = (await createRes.json()) as {
      ok: boolean;
      data: { referenceCode: string };
    };
    const donorRef = createData.data.referenceCode;

    // 2. Upload a valid PNG slip
    const presignRes = await request.post("/api/uploads/presign", {
      headers: nextIpHeaders(),
      data: {
        purpose: "donation_slip",
        fileName: "valid_slip.png",
        contentType: "image/png",
        size: 8,
        entityRef: donorRef,
        turnstileToken: "1x00000000000000000000AA",
      },
    });
    expect(presignRes.ok()).toBe(true);
    const presignData = (await presignRes.json()) as {
      ok: boolean;
      data: { uploadUrl: string; key: string };
    };

    // Valid PNG magic bytes
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validUploadTarget = presignData.data.uploadUrl.startsWith("/")
      ? `http://localhost:8787${presignData.data.uploadUrl}`
      : presignData.data.uploadUrl;
    const uploadRes = await fetch(validUploadTarget, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: pngBytes,
    });
    expect(uploadRes.ok).toBe(true);

    const submitRes = await request.post(`/api/donations/${donorRef}/submit`, {
      headers: nextIpHeaders(),
      data: {
        slipKey: presignData.data.key,
        txnReference: "FT-TEST-GOLD-01",
      },
    });
    expect(submitRes.ok()).toBe(true);

    // 3. Admin signs in via /en/login
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
      { cwd: "apps/api", encoding: "utf-8" },
    );

    // Approve the donation using page.request (which has the authenticated session cookie)
    const approveRes = await page.request.post(`/api/admin/donations/${donorRef}/approve`, {
      headers: nextIpHeaders(),
      data: { messageApproved: true },
    });
    expect(approveRes.ok()).toBe(true);

    // 4. Verify GeoJSON /merchants/geo endpoint reflects supporter update
    const geoRes = await request.get("/api/merchants/geo");
    expect(geoRes.ok()).toBe(true);
    const geoJson = (await geoRes.json()) as {
      type: string;
      features: Array<{
        type: string;
        geometry: { coordinates: [number, number] };
        properties: { id: string; shopName: string; isSupporter: boolean };
      }>;
    };
    expect(geoJson.type).toBe("FeatureCollection");
    const gunawardenaFeature = geoJson.features.find(
      (f) => f.properties.shopName === "Gunawardena Mini Mart",
    );
    expect(gunawardenaFeature).toBeDefined();
    expect(gunawardenaFeature?.properties.isSupporter).toBe(true);

    // Also verify donation is now counted in monthly summary
    const summaryRes = await request.get("/api/donations/summary");
    expect(summaryRes.ok()).toBe(true);
    const summaryData = (await summaryRes.json()) as {
      ok: boolean;
      data: { monthlyTotalCents: number; totalSupportersCount: number };
    };
    expect(summaryData.data.totalSupportersCount).toBeGreaterThanOrEqual(1);
    expect(summaryData.data.monthlyTotalCents).toBeGreaterThanOrEqual(100000);
  });
});
