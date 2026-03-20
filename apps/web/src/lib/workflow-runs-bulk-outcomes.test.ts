import { describe, expect, it } from "vitest";

import { buildWorkflowRunsBulkOutcomePanel } from "./workflow-runs-bulk-outcomes";

describe("workflow-runs-bulk-outcomes helpers", () => {
  it("builds a retry outcome panel with row details", () => {
    const panel = buildWorkflowRunsBulkOutcomePanel("retry", {
      requestedCount: 2,
      eligibleCount: 1,
      skippedCount: 1,
      successCount: 1,
      failureCount: 0,
      results: [
        {
          runId: "run-success",
          status: "success",
          message: "Retried as run-new.",
          workflowRun: {
            workflowRun: {
              id: "run-new",
              kind: "prefill",
              status: "failed",
              executionMode: "direct",
              workflowId: null,
              workflowType: null,
              taskQueue: null,
              retryOfRunId: "run-success",
              jobId: "job-1",
              applicationId: "app-1",
              resumeVersionId: null,
              errorMessage: "DNS lookup failed",
              startedAt: "2026-03-18T12:00:00.000Z",
              completedAt: "2026-03-18T12:01:00.000Z",
              createdAt: "2026-03-18T12:00:00.000Z",
              updatedAt: "2026-03-18T12:01:00.000Z"
            },
            job: {
              id: "job-1",
              title: "Staff Platform Engineer",
              company: "Rolecraft"
            },
            application: {
              id: "app-1",
              status: "failed",
              approvalStatus: "pending_review",
              submissionStatus: "not_ready"
            },
            resumeVersion: null,
            retryOfRun: null,
            latestRetry: null
          }
        },
        {
          runId: "run-skipped",
          status: "skipped",
          message: "Only failed workflow runs can be retried.",
          workflowRun: null
        }
      ]
    });

    expect(panel.title).toBe("Bulk retry completed");
    expect(panel.summary).toBe("Retried 1 run, 0 failed, 1 skipped.");
    expect(panel.rows).toEqual([
      {
        runId: "run-success",
        status: "success",
        message: "Retried as run-new.",
        tone: "success",
        runDetailHref: "/workflow-runs/run-new"
      },
      {
        runId: "run-skipped",
        status: "skipped",
        message: "Only failed workflow runs can be retried.",
        tone: "neutral",
        runDetailHref: null
      }
    ]);
  });

  it("builds a cancel outcome panel and maps failed rows to danger tone", () => {
    const panel = buildWorkflowRunsBulkOutcomePanel("cancel", {
      requestedCount: 1,
      eligibleCount: 1,
      skippedCount: 0,
      successCount: 0,
      failureCount: 1,
      results: [
        {
          runId: "run-failed",
          status: "failed",
          message: "Temporal cancellation request was rejected.",
          workflowRun: null
        }
      ]
    });

    expect(panel.title).toBe("Bulk cancel completed");
    expect(panel.summary).toBe("Cancelled 0 runs, 1 failed, 0 skipped.");
    expect(panel.rows).toEqual([
      {
        runId: "run-failed",
        status: "failed",
        message: "Temporal cancellation request was rejected.",
        tone: "danger",
        runDetailHref: null
      }
    ]);
  });

  it("returns null when there is no bulk response to present", () => {
    expect(buildWorkflowRunsBulkOutcomePanel("retry", null)).toBeNull();
  });
});
