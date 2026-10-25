import { expect, test } from "@playwright/test";

test.describe.serial("Feedback Tracker (F-07 / AC-07.1 & AC-07.2)", () => {
  const ticketTitle = `Printer Margin Bug ${Date.now()}`;
  const ticketBody = "When printing a bill on 58mm thermal paper, the top margin is cut off.";
  const secretContact = "secret-owner@shop58.example.com";
  let ticketNumber = "";

  test("submits a bug ticket and displays ticket number", async ({ page }) => {
    await page.goto("/en/feedback/new?type=bug");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Fill title
    const titleInput = page.getByPlaceholder("For example, receipts cut off halfway on a 58mm printer");
    await expect(titleInput).toBeVisible();
    await titleInput.fill(ticketTitle);

    // Fill body
    const bodyInput = page.getByPlaceholder(/Details, steps to reproduce/i);
    await expect(bodyInput).toBeVisible();
    await bodyInput.fill(ticketBody);

    // Fill contact email
    const contactInput = page.getByPlaceholder("077 123 4567 or email@example.com");
    await expect(contactInput).toBeVisible();
    await contactInput.fill(secretContact);

    // Submit ticket
    const submitBtn = page.getByRole("button", { name: /Send ticket/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify success confirmation with CB-XXXX format
    const confirmation = page.locator("text=/CB-\\d{4}/").first();
    await expect(confirmation).toBeVisible({ timeout: 15_000 });
    const confirmationText = await confirmation.textContent();
    const match = confirmationText?.match(/CB-\d{4}/);
    expect(match).toBeTruthy();
    ticketNumber = match![0];
  });

  test("public board and detail view enforce privacy (AC-07.1)", async ({ page }) => {
    expect(ticketNumber).toBeTruthy();

    // Navigate to public feedback board
    await page.goto("/en/feedback");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Feedback");

    // The submitted ticket title should appear on the public board
    await expect(page.getByText(ticketTitle)).toBeVisible({ timeout: 10_000 });

    // Contact info must NOT be exposed anywhere in the DOM (AC-07.1)
    const boardContent = await page.content();
    expect(boardContent.includes(secretContact)).toBe(false);

    // Click into ticket detail page
    await page.getByText(ticketTitle).click();
    await page.waitForURL(new RegExp(`/en/feedback/${ticketNumber}`));

    // Verify detail page contains title and description
    await expect(page.getByText(ticketTitle)).toBeVisible();
    await expect(page.getByText(ticketBody)).toBeVisible();

    // Verify contact email is strictly NOT exposed on detail page
    const detailContent = await page.content();
    expect(detailContent.includes(secretContact)).toBe(false);
  });

  test("voting increments count and deduplicates repeated votes (AC-07.2)", async ({ page }) => {
    expect(ticketNumber).toBeTruthy();

    // Navigate directly to ticket detail
    await page.goto(`/en/feedback/${ticketNumber}`);
    await expect(page.getByText(ticketTitle)).toBeVisible({ timeout: 10_000 });

    const voteButton = page.getByRole("button", {
      name: new RegExp(`Vote for ticket ${ticketNumber}`, "i"),
    });
    await expect(voteButton).toBeVisible();

    const initialText = (await voteButton.textContent()) || "";
    const initialCount = parseInt(initialText.replace(/\D/g, "") || "0", 10);

    // First vote
    await voteButton.click();
    await expect(voteButton).toHaveText(new RegExp(String(initialCount + 1)), { timeout: 5000 });

    // Second vote attempt from same browser context / voter
    await voteButton.click();
    // Count must stay at initialCount + 1 (AC-07.2 deduplication)
    await expect(voteButton).toHaveText(new RegExp(String(initialCount + 1)));
  });
});
