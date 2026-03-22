import { expect, test } from "playwright/test";

import { startBrowserHappyPathRuntime, stopBrowserHappyPathRuntime } from "./support/runtime.js";

test("browser happy path reaches application review", async ({ page }) => {
  const { webUrl } = await startBrowserHappyPathRuntime();

  try {
    await page.goto(`${webUrl}/profile`);

    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    await page.getByLabel("Full name").fill("Ada Lovelace");
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByLabel("Phone").fill("555-0101");
    await page.getByLabel("Location").fill("Remote");
    await page.getByLabel("LinkedIn URL").fill("https://www.linkedin.com/in/ada-lovelace");
    await page.getByLabel("GitHub URL").fill("https://github.com/ada-lovelace");
    await page.getByLabel("Work authorization").fill("Authorized to work in Canada");
    await page.getByLabel("Summary").fill("Platform-minded engineer who values reliable internal systems.");
    await page.getByLabel("Skills").fill("TypeScript, React, Prisma");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(
      page.getByText("Profile saved. Future analysis runs now have fresh candidate context.")
    ).toBeVisible();

    await page.goto(`${webUrl}/settings`);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await page.getByLabel("API Key").fill("test-api-key");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("Settings saved. The analyzer will use this configuration.")).toBeVisible();

    await page.goto(`${webUrl}/jobs`);
    await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();
    await page.getByLabel("Job URL").fill("https://jobs.example.com/platform-engineer");
    await page.getByRole("button", { name: "Import job" }).click();
    await expect(page.getByRole("button", { name: "Analyze job" })).toBeVisible();

    await page.getByRole("button", { name: "Analyze job" }).click();
    await expect(page.getByText("Analysis updated.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Decision support" })).toBeVisible();
    await expect(page.getByText("No analysis result yet. Run it when the imported JD looks right.")).toHaveCount(0);

    await page.getByRole("button", { name: "Generate resume" }).click();
    await expect(page.getByText(/Resume version ready:/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Download latest PDF/i })).toBeVisible();

    await page.getByRole("button", { name: "Run prefill" }).click();
    await expect(page.getByRole("link", { name: "Review this run" })).toBeVisible();
    await page.getByRole("link", { name: "Review this run" }).click();

    await expect(page.getByRole("heading", { name: "Automation sessions" })).toBeVisible();
    await expect(page.getByText("Prefill summary")).toBeVisible();
    await expect(
      page.getByText("No unresolved automation items are waiting for manual follow-up.")
    ).toBeVisible();
  } finally {
    await page.close().catch(() => undefined);
    await stopBrowserHappyPathRuntime();
  }
});
