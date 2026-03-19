import { describe, expect, it } from "vitest";

import type { WorkflowRun } from "@openclaw/shared-types";

import {
  getWorkflowRunDashboardSummary,
  getWorkflowRunStatusCopy,
  hasActiveWorkflowRuns
} from "./workflow-run-status";

function buildRun(overrides: Partial<WorkflowRun>): WorkflowRun {
  return {
    id: "run_1",
    jobId: "job_1",
    retryOfRunId: null,
    applicationId: null,
    resumeVersionId: null,
    kind: "analyze",
    status: "queued",
    executionMode: "temporal",
    workflowId: "analyze-job-job_1-123",
    workflowType: "analyzeJobWorkflow",
    taskQueue: "openclaw-analysis",
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

describe("workflow-run-status helpers", () => {
  it("describes queued Temporal runs clearly", () => {
    const copy = getWorkflowRunStatusCopy(buildRun({ status: "queued", executionMode: "temporal" }));

    expect(copy.label).toBe("Queued in Temporal");
    expect(copy.detail).toContain("waiting for a worker");
  });

  it("describes running direct runs differently from Temporal runs", () => {
    const direct = getWorkflowRunStatusCopy(buildRun({ status: "running", executionMode: "direct" }));
    const temporal = getWorkflowRunStatusCopy(buildRun({ status: "running", executionMode: "temporal" }));

    expect(direct.label).toBe("Running");
    expect(direct.detail).toContain("direct API path");
    expect(direct.detail).toContain("safe cancellation point in this API process");
    expect(temporal.detail).toContain("Temporal worker");
    expect(temporal.detail).toContain("safe cancellation point");
  });

  it("describes cancelled runs before start without presenting them like failures", () => {
    const copy = getWorkflowRunStatusCopy(buildRun({ status: "cancelled", startedAt: null }));

    expect(copy.label).toBe("Cancelled before execution");
    expect(copy.detail).toContain("did not roll back");
  });

  it("describes cancelled runs that had already started as stopped in progress", () => {
    const copy = getWorkflowRunStatusCopy(
      buildRun({
        status: "cancelled",
        startedAt: "2026-03-19T00:37:35.022Z",
        completedAt: "2026-03-19T00:37:38.100Z"
      })
    );

    expect(copy.label).toBe("Cancelled during execution");
    expect(copy.detail).toContain("stopped at a safe cancellation point");
  });

  it("describes completed runs with downstream next steps when available", () => {
    const resumeCopy = getWorkflowRunStatusCopy(
      buildRun({
        kind: "generate_resume",
        status: "completed",
        resumeVersionId: "resume_1"
      })
    );
    const applicationCopy = getWorkflowRunStatusCopy(
      buildRun({
        kind: "prefill",
        status: "completed",
        applicationId: "application_1"
      })
    );

    expect(resumeCopy.detail).toContain("Open resume version");
    expect(applicationCopy.detail).toContain("Review application run");
  });

  it("builds compact dashboard summaries", () => {
    expect(
      getWorkflowRunDashboardSummary(buildRun({ kind: "analyze", status: "queued" }))
    ).toBe("Analyze queued");
    expect(
      getWorkflowRunDashboardSummary(
        buildRun({ kind: "generate_resume", status: "running", executionMode: "direct" })
      )
    ).toBe("Resume running");
    expect(
      getWorkflowRunDashboardSummary(buildRun({ kind: "prefill", status: "cancelled" }))
    ).toBe("Prefill cancelled");
  });

  it("compresses noisy failed error messages into a short summary", () => {
    const copy = getWorkflowRunStatusCopy(
      buildRun({
        status: "failed",
        errorMessage:
          "page.goto: net::ERR_NAME_NOT_RESOLVED at https://example.com/jobs/staff-platform-engineer\nCall log:\n  - navigating..."
      })
    );

    expect(copy.label).toBe("Failed");
    expect(copy.detail).toBe(
      "page.goto: net::ERR_NAME_NOT_RESOLVED at https://example.com/jobs/staff-platform-engineer"
    );
  });

  it("detects whether any workflow run is still active", () => {
    expect(
      hasActiveWorkflowRuns([
        buildRun({ status: "completed" }),
        buildRun({ id: "run_2", status: "failed" })
      ])
    ).toBe(false);

    expect(
      hasActiveWorkflowRuns([
        buildRun({ status: "completed" }),
        buildRun({ id: "run_2", status: "running" })
      ])
    ).toBe(true);
  });
});
