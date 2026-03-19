import { BadRequestException, ConflictException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkflowRunCancelService } from "./workflow-run-cancel.service.js";

const queuedTemporalRun = {
  id: "run_temporal_queued",
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
  updatedAt: new Date().toISOString()
} as const;

describe("WorkflowRunCancelService", () => {
  const originalTemporalEnabled = process.env.TEMPORAL_ENABLED;

  beforeEach(() => {
    delete process.env.TEMPORAL_ENABLED;
  });

  afterEach(() => {
    if (originalTemporalEnabled === undefined) {
      delete process.env.TEMPORAL_ENABLED;
      return;
    }

    process.env.TEMPORAL_ENABLED = originalTemporalEnabled;
  });

  it("cancels a queued temporal workflow run", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi.fn().mockResolvedValue(queuedTemporalRun),
      markCancelled: vi.fn().mockResolvedValue({
        ...queuedTemporalRun,
        status: "cancelled",
        completedAt: new Date().toISOString()
      })
    };
    const temporalService = {
      cancelWorkflow: vi.fn().mockResolvedValue(undefined)
    };

    const service = new WorkflowRunCancelService(
      workflowRunsService as any,
      temporalService as any,
      { has: vi.fn(), cancel: vi.fn() } as any
    );

    const result = await service.cancelWorkflowRun("run_temporal_queued");

    expect(temporalService.cancelWorkflow).toHaveBeenCalledWith("analyze-job-job_1-123");
    expect(workflowRunsService.markCancelled).toHaveBeenCalledWith("run_temporal_queued");
    expect(result.status).toBe("cancelled");
  });

  it("requests cancellation for running direct runs that are still registered in this API process", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi.fn().mockResolvedValue({
        ...queuedTemporalRun,
        executionMode: "direct",
        status: "running",
        workflowId: null
      })
    };
    const directRunCancellationRegistry = {
      has: vi.fn().mockReturnValue(true),
      cancel: vi.fn()
    };

    const service = new WorkflowRunCancelService(
      workflowRunsService as any,
      { cancelWorkflow: vi.fn() } as any,
      directRunCancellationRegistry as any
    );

    const result = await service.cancelWorkflowRun("run_direct_running");

    expect(directRunCancellationRegistry.has).toHaveBeenCalledWith("run_temporal_queued");
    expect(directRunCancellationRegistry.cancel).toHaveBeenCalledWith("run_temporal_queued");
    expect(result.status).toBe("running");
  });

  it("rejects cancellation for running direct runs that are no longer cancellable in this API process", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi.fn().mockResolvedValue({
        ...queuedTemporalRun,
        executionMode: "direct",
        status: "running",
        workflowId: null
      })
    };
    const directRunCancellationRegistry = {
      has: vi.fn().mockReturnValue(false),
      cancel: vi.fn()
    };

    const service = new WorkflowRunCancelService(
      workflowRunsService as any,
      { cancelWorkflow: vi.fn() } as any,
      directRunCancellationRegistry as any
    );

    await expect(service.cancelWorkflowRun("run_direct_running")).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(directRunCancellationRegistry.cancel).not.toHaveBeenCalled();
  });

  it("rejects cancellation for non-running direct runs", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi.fn().mockResolvedValue({
        ...queuedTemporalRun,
        executionMode: "direct",
        status: "completed",
        workflowId: null
      })
    };

    const service = new WorkflowRunCancelService(
      workflowRunsService as any,
      { cancelWorkflow: vi.fn() } as any,
      { has: vi.fn(), cancel: vi.fn() } as any
    );

    await expect(service.cancelWorkflowRun("run_direct")).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("requests cancellation for running temporal runs without marking them cancelled immediately", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi.fn().mockResolvedValue({
        ...queuedTemporalRun,
        status: "running"
      }),
      markCancelled: vi.fn()
    };
    const temporalService = {
      cancelWorkflow: vi.fn().mockResolvedValue(undefined)
    };

    const service = new WorkflowRunCancelService(
      workflowRunsService as any,
      temporalService as any,
      { has: vi.fn(), cancel: vi.fn() } as any
    );

    const result = await service.cancelWorkflowRun("run_temporal_running");

    expect(temporalService.cancelWorkflow).toHaveBeenCalledWith("analyze-job-job_1-123");
    expect(workflowRunsService.markCancelled).not.toHaveBeenCalled();
    expect(result.status).toBe("running");
  });

  it("rejects cancellation for completed temporal runs", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi.fn().mockResolvedValue({
        ...queuedTemporalRun,
        status: "completed"
      })
    };

    const service = new WorkflowRunCancelService(
      workflowRunsService as any,
      { cancelWorkflow: vi.fn() } as any,
      { has: vi.fn(), cancel: vi.fn() } as any
    );

    await expect(service.cancelWorkflowRun("run_temporal_completed")).rejects.toBeInstanceOf(
      BadRequestException
    );
  });
});
