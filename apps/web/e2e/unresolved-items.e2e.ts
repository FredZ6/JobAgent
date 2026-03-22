import { chromium, expect, test } from "playwright/test";

import { seedUnresolvedReviewFixture, startBrowserHappyPathRuntime, stopBrowserHappyPathRuntime } from "./support/runtime.js";

test("browser unresolved item actions work in application review and submission review", async () => {
  const { webUrl } = await startBrowserHappyPathRuntime();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const fixture = await seedUnresolvedReviewFixture();

    await page.goto(`${webUrl}/applications/${fixture.applicationId}`);

    const applicationNeedsAttentionPanel = page
      .locator(".panel")
      .filter({ has: page.getByRole("heading", { name: "Needs attention", exact: true }) });
    await expect(page.getByRole("heading", { name: "Needs attention", exact: true })).toBeVisible();
    const resolveItem = applicationNeedsAttentionPanel
      .locator(".application-field")
      .filter({ hasText: fixture.resolveTitle })
      .first();
    await resolveItem.getByLabel(`Add note for ${fixture.resolveTitle}`).fill("Handled in browser e2e");
    await resolveItem.getByRole("button", { name: `Mark resolved for ${fixture.resolveTitle}` }).click();

    await expect(resolveItem.getByRole("button", { name: `Mark resolved for ${fixture.resolveTitle}` })).toHaveCount(0);
    await expect(resolveItem.getByText("resolved", { exact: true })).toBeVisible();

    await page.goto(`${webUrl}/applications/${fixture.applicationId}/submission-review`);

    const submissionNeedsAttentionPanel = page
      .locator(".panel")
      .filter({ has: page.getByRole("heading", { name: "Needs attention", exact: true }) });
    await expect(page.getByRole("heading", { name: "Needs attention", exact: true })).toBeVisible();
    const ignoreItem = submissionNeedsAttentionPanel
      .locator(".application-field")
      .filter({ hasText: fixture.ignoreTitle })
      .first();
    await ignoreItem.getByLabel(`Add note for ${fixture.ignoreTitle}`).fill("Ignore this for now");
    await ignoreItem.getByRole("button", { name: `Ignore for ${fixture.ignoreTitle}` }).click();

    await expect(ignoreItem.getByRole("button", { name: `Ignore for ${fixture.ignoreTitle}` })).toHaveCount(0);
    await expect(ignoreItem.getByText("ignored", { exact: true })).toBeVisible();
  } finally {
    await browser.close().catch(() => undefined);
    await stopBrowserHappyPathRuntime();
  }
});
