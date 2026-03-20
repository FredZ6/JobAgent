import { describe, expect, it } from "vitest";

import type { WorkflowRunListItem } from "@rolecraft/shared-types";

import {
  buildWorkflowRunsEligibilitySummary,
  getWorkflowRunsEligibilityMessages
} from "./workflow-runs-eligibility";

function buildListItem(
  id: string,
  overrides: Partial<WorkflowRunListItem["workflowRun"]>
): WorkflowRunListItem {
  return {
    workflowRun: {
      id,
      jobId: `job_${id}`,
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: null,
      kind: "analyze",
      status: "completed",
      executionMode: "direct",
      workflowId: null,
      workflowType: null,
      taskQueue: null,
      startedAt: "2026-03-18T10:00:00.000Z",
      completedAt: "2026-03-18T10:01:00.000Z",
      errorMessage: null,
      createdAt: "2026-03-18T10:00:00.000Z",
      updatedAt: "2026-03-18T10:01:00.000Z",
      ...overrides
    },
    job: {
      id: `job_${id}`,
      title: `Job ${id}`,
      company: "Example Co"
    },
    application: null,
    resumeVersion: null
  };
}

describe("workflow-runs-eligibility helpers", () => {
  it("classifies selected runs into retry eligible, cancel eligible, and ineligible", () => {
    const summary = buildWorkflowRunsEligibilitySummary(
      [
        buildListItem("run_failed", { status: "failed" }),
        buildListItem("run_queued_temporal", { status: "queued", executionMode: "temporal" }),
        buildListItem("run_completed", { status: "completed" })
      ],
      ["run_failed", "run_queued_temporal", "run_completed"]
    );

    expect(summary.retryEligibleIds).toEqual(["run_failed"]);
    expect(summary.cancelEligibleIds).toEqual(["run_queued_temporal"]);
    expect(summary.ineligibleIds).toEqual(["run_completed"]);
    expect(summary.selectedCount).toBe(3);
    expect(summary.retryEligibleCount).toBe(1);
    expect(summary.cancelEligibleCount).toBe(1);
    expect(summary.ineligibleCount).toBe(1);
  });

  it("generates mixed-selection guardrail messages", () => {
    const messages = getWorkflowRunsEligibilityMessages({
      selectedCount: 3,
      retryEligibleIds: ["run_failed"],
      cancelEligibleIds: ["run_queued_temporal"],
      ineligibleIds: ["run_completed"],
      retryEligibleCount: 1,
      cancelEligibleCount: 1,
      ineligibleCount: 1
    });

    expect(messages).toEqual([
      "Only failed runs are retry eligible.",
      "Only queued Temporal runs are cancel eligible."
    ]);
  });

  it("returns a direct message when nothing selected is eligible", () => {
    const messages = getWorkflowRunsEligibilityMessages({
      selectedCount: 2,
      retryEligibleIds: [],
      cancelEligibleIds: [],
      ineligibleIds: ["run_completed", "run_running"],
      retryEligibleCount: 0,
      cancelEligibleCount: 0,
      ineligibleCount: 2
    });

    expect(messages).toEqual(["No selected runs are eligible for retry or cancel."]);
  });
});
