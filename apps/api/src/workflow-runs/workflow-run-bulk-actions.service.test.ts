import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { WorkflowRunBulkActionsService } from "./workflow-run-bulk-actions.service.js";

function buildRun(
  id: string,
  overrides: Partial<{
    status: "queued" | "running" | "completed" | "failed" | "cancelled";
    executionMode: "direct" | "temporal";
    kind: "analyze" | "generate_resume" | "prefill";
  }> = {}
) {
  return {
    id,
    jobId: `job_${id}`,
    retryOfRunId: null,
    applicationId: null,
    resumeVersionId: null,
    kind: overrides.kind ?? "analyze",
    status: overrides.status ?? "completed",
    executionMode: overrides.executionMode ?? "direct",
    workflowId: overrides.executionMode === "temporal" ? `wf_${id}` : null,
    workflowType: overrides.executionMode === "temporal" ? "analyzeJobWorkflow" : null,
    taskQueue: overrides.executionMode === "temporal" ? "openclaw-analysis" : null,
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function buildDetail(runId: string) {
  const timestamp = new Date().toISOString();
  return {
    workflowRun: {
      id: runId,
      jobId: `job_${runId}`,
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: null,
      kind: "analyze",
      status: "completed",
      executionMode: "direct",
      workflowId: null,
      workflowType: null,
      taskQueue: null,
      startedAt: timestamp,
      completedAt: timestamp,
      errorMessage: null,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    job: {
      id: `job_${runId}`,
      title: `Job ${runId}`,
      company: "OpenClaw"
    },
    application: null,
    resumeVersion: null,
    retryOfRun: null,
    latestRetry: null
  };
}

describe("WorkflowRunBulkActionsService", () => {
  it("bulk retries only failed runs and skips the rest", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi
        .fn()
        .mockResolvedValueOnce(buildRun("run_failed", { status: "failed" }))
        .mockResolvedValueOnce(buildRun("run_completed", { status: "completed" })),
      getWorkflowRunDetail: vi.fn().mockResolvedValue(buildDetail("run_retry"))
    };
    const workflowRunRetriesService = {
      retryWorkflowRun: vi.fn().mockResolvedValue({ id: "run_retry" })
    };
    const workflowRunCancelService = {
      cancelWorkflowRun: vi.fn()
    };

    const service = new WorkflowRunBulkActionsService(
      workflowRunsService as any,
      workflowRunRetriesService as any,
      workflowRunCancelService as any
    );

    const result = await service.bulkRetryWorkflowRuns({
      runIds: ["run_failed", "run_completed"]
    });

    expect(workflowRunRetriesService.retryWorkflowRun).toHaveBeenCalledWith("run_failed");
    expect(workflowRunCancelService.cancelWorkflowRun).not.toHaveBeenCalled();
    expect(result.eligibleCount).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(result.results).toEqual([
      expect.objectContaining({
        runId: "run_failed",
        status: "success"
      }),
      expect.objectContaining({
        runId: "run_completed",
        status: "skipped",
        message: "Only failed workflow runs can be retried."
      })
    ]);
  });

  it("bulk cancels only queued temporal runs and skips the rest", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi
        .fn()
        .mockResolvedValueOnce(
          buildRun("run_temporal_queued", { status: "queued", executionMode: "temporal" })
        )
        .mockResolvedValueOnce(
          buildRun("run_temporal_running", { status: "running", executionMode: "temporal" })
        )
        .mockResolvedValueOnce(
          buildRun("run_direct_failed", { status: "failed", executionMode: "direct" })
        ),
      getWorkflowRunDetail: vi.fn().mockResolvedValue(buildDetail("run_temporal_queued"))
    };
    const workflowRunRetriesService = {
      retryWorkflowRun: vi.fn()
    };
    const workflowRunCancelService = {
      cancelWorkflowRun: vi.fn().mockResolvedValue({ id: "run_temporal_queued" })
    };

    const service = new WorkflowRunBulkActionsService(
      workflowRunsService as any,
      workflowRunRetriesService as any,
      workflowRunCancelService as any
    );

    const result = await service.bulkCancelWorkflowRuns({
      runIds: ["run_temporal_queued", "run_temporal_running", "run_direct_failed"]
    });

    expect(workflowRunCancelService.cancelWorkflowRun).toHaveBeenCalledWith("run_temporal_queued");
    expect(workflowRunRetriesService.retryWorkflowRun).not.toHaveBeenCalled();
    expect(result.eligibleCount).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.skippedCount).toBe(2);
    expect(result.results[1]).toEqual(
      expect.objectContaining({
        runId: "run_temporal_running",
        status: "skipped",
        message: "Only queued Temporal workflow runs can be cancelled."
      })
    );
  });

  it("rejects bulk retry when more than five eligible runs are selected", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi
        .fn()
        .mockResolvedValue(buildRun("run_failed", { status: "failed" })),
      getWorkflowRunDetail: vi.fn()
    };

    const service = new WorkflowRunBulkActionsService(
      workflowRunsService as any,
      { retryWorkflowRun: vi.fn() } as any,
      { cancelWorkflowRun: vi.fn() } as any
    );

    await expect(
      service.bulkRetryWorkflowRuns({
        runIds: ["1", "2", "3", "4", "5", "6"]
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns mixed success, skipped, and failed rows without aborting the whole retry batch", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi
        .fn()
        .mockResolvedValueOnce(buildRun("run_failed_ok", { status: "failed" }))
        .mockResolvedValueOnce(buildRun("run_failed_again", { status: "failed" }))
        .mockResolvedValueOnce(buildRun("run_completed", { status: "completed" })),
      getWorkflowRunDetail: vi
        .fn()
        .mockResolvedValueOnce(buildDetail("run_retry_ok"))
    };
    const workflowRunRetriesService = {
      retryWorkflowRun: vi
        .fn()
        .mockResolvedValueOnce({ id: "run_retry_ok" })
        .mockRejectedValueOnce(new Error("worker failed again"))
    };

    const service = new WorkflowRunBulkActionsService(
      workflowRunsService as any,
      workflowRunRetriesService as any,
      { cancelWorkflowRun: vi.fn() } as any
    );

    const result = await service.bulkRetryWorkflowRuns({
      runIds: ["run_failed_ok", "run_failed_again", "run_completed"]
    });

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.results).toEqual([
      expect.objectContaining({ runId: "run_failed_ok", status: "success" }),
      expect.objectContaining({
        runId: "run_failed_again",
        status: "failed",
        message: "worker failed again"
      }),
      expect.objectContaining({
        runId: "run_completed",
        status: "skipped"
      })
    ]);
  });
});
