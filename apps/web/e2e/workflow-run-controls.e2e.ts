import { expect, test } from "playwright/test";

import {
  seedTemporalWorkflowRunFixture,
  startBrowserHappyPathRuntime,
  stopBrowserHappyPathRuntime
} from "./support/runtime.js";

test("browser workflow run controls support pause and resume for temporal runs", async ({ page }) => {
  const { webUrl } = await startBrowserHappyPathRuntime();

  try {
    const fixture = await seedTemporalWorkflowRunFixture();

    await page.goto(`${webUrl}/workflow-runs/${fixture.workflowRunId}`);

    await expect(page.getByRole("button", { name: "Pause run" })).toBeVisible();
    await page.getByRole("button", { name: "Pause run" }).click();

    await expect(page.getByText(new RegExp(`Paused run ${fixture.workflowRunId}`))).toBeVisible();
    await expect(page.getByRole("button", { name: "Resume run" })).toBeVisible();

    await page.getByRole("button", { name: "Resume run" }).click();

    await expect(page.getByText(new RegExp(`Resume requested for run ${fixture.workflowRunId}`))).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause run" })).toBeVisible();
  } finally {
    await page.close().catch(() => undefined);
    await stopBrowserHappyPathRuntime();
  }
});
