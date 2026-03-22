import { expect, test } from "playwright/test";

import { seedFallbackJobFixture, startBrowserHappyPathRuntime, stopBrowserHappyPathRuntime } from "./support/runtime.js";

test("browser importer fallback path shows fallback quality on list and detail", async ({ page }) => {
  const { webUrl } = await startBrowserHappyPathRuntime();

  try {
    const { jobId, title } = await seedFallbackJobFixture();

    await page.goto(`${webUrl}/jobs`);

    await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
    await expect(page.getByText("Fallback import")).toBeVisible();

    await page.getByRole("link", { name: new RegExp(title) }).click();

    await expect(page).toHaveURL(`${webUrl}/jobs/${jobId}`);
    await expect(page.getByRole("heading", { name: "Import quality" })).toBeVisible();
    await expect(page.getByText("Fallback import")).toBeVisible();
    await expect(page.getByText("Fetching the job page failed")).toBeVisible();
    await expect(page.getByText("Fetch status: 503")).toBeVisible();
    await expect(page.getByText("Description source: fallback")).toBeVisible();
  } finally {
    await page.close().catch(() => undefined);
    await stopBrowserHappyPathRuntime();
  }
});
