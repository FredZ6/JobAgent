import { BadRequestException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkflowRunRetriesService } from "./workflow-run-retries.service.js";

const failedAnalyzeRun = {
  id: "run_failed_analyze",
  jobId: "job_1",
  retryOfRunId: null,
  applicationId: null,
  resumeVersionId: null,
  kind: "analyze",
  status: "failed",
  executionMode: "direct",
  workflowId: null,
  workflowType: null,
  taskQueue: null,
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  errorMessage: "analysis failed",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
} as const;

describe("WorkflowRunRetriesService", () => {
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

  it("retries a failed analyze run by creating a fresh direct run", async () => {
    process.env.TEMPORAL_ENABLED = "false";

    const workflowRunsService = {
      getWorkflowRun: vi
        .fn()
        .mockResolvedValueOnce(failedAnalyzeRun)
        .mockResolvedValueOnce({
          ...failedAnalyzeRun,
          id: "run_retry",
          retryOfRunId: "run_failed_analyze",
          status: "completed",
          errorMessage: null
        }),
      createDirectRun: vi.fn().mockResolvedValue({ id: "run_retry" }),
      markRetried: vi.fn().mockResolvedValue({}),
      getLatestRetryRun: vi.fn().mockResolvedValue({
        ...failedAnalyzeRun,
        id: "run_retry",
        retryOfRunId: "run_failed_analyze",
        status: "completed",
        errorMessage: null
      })
    };
    const directAnalysisService = {
      analyzeJob: vi.fn().mockResolvedValue({ id: "analysis_2" })
    };
    const directResumeService = {
      generateResume: vi.fn()
    };
    const applicationsService = {
      prefillJobDirect: vi.fn()
    };
    const temporalService = {
      executeAnalyzeJobWorkflow: vi.fn(),
      executeGenerateResumeWorkflow: vi.fn(),
      executePrefillJobWorkflow: vi.fn()
    };

    const service = new WorkflowRunRetriesService(
      workflowRunsService as any,
      directAnalysisService as any,
      directResumeService as any,
      applicationsService as any,
      temporalService as any
    );

    const result = await service.retryWorkflowRun("run_failed_analyze");

    expect(workflowRunsService.createDirectRun).toHaveBeenCalledWith({
      jobId: "job_1",
      kind: "analyze",
      retryOfRunId: "run_failed_analyze"
    });
    expect(workflowRunsService.markRetried).toHaveBeenCalledWith("run_failed_analyze", "run_retry");
    expect(directAnalysisService.analyzeJob).toHaveBeenCalledWith(
      "job_1",
      expect.objectContaining({
        executionMode: "direct"
      }),
      "run_retry"
    );
    expect(result.retryOfRunId).toBe("run_failed_analyze");
  });

  it("retries a failed prefill run through Temporal when enabled", async () => {
    process.env.TEMPORAL_ENABLED = "true";

    const workflowRunsService = {
      getWorkflowRun: vi.fn().mockResolvedValue({
        ...failedAnalyzeRun,
        id: "run_failed_prefill",
        kind: "prefill",
        applicationId: "app_failed"
      }),
      createDirectRun: vi.fn(),
      getLatestRetryRun: vi.fn().mockResolvedValue({
        ...failedAnalyzeRun,
        id: "run_retry_prefill",
        kind: "prefill",
        retryOfRunId: "run_failed_prefill",
        applicationId: "app_retry",
        status: "completed",
        executionMode: "temporal",
        workflowId: "prefill-job-job_1-456",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis",
        errorMessage: null
      }),
      markRetried: vi.fn().mockResolvedValue({})
    };
    const directAnalysisService = {
      analyzeJob: vi.fn()
    };
    const directResumeService = {
      generateResume: vi.fn()
    };
    const applicationsService = {
      prefillJobDirect: vi.fn()
    };
    const temporalService = {
      executeAnalyzeJobWorkflow: vi.fn(),
      executeGenerateResumeWorkflow: vi.fn(),
      executePrefillJobWorkflow: vi.fn().mockResolvedValue({
        application: {
          id: "app_retry"
        }
      })
    };

    const service = new WorkflowRunRetriesService(
      workflowRunsService as any,
      directAnalysisService as any,
      directResumeService as any,
      applicationsService as any,
      temporalService as any
    );

    const result = await service.retryWorkflowRun("run_failed_prefill");

    expect(temporalService.executePrefillJobWorkflow).toHaveBeenCalledWith("job_1", {
      retryOfRunId: "run_failed_prefill"
    });
    expect(workflowRunsService.markRetried).toHaveBeenCalledWith(
      "run_failed_prefill",
      "run_retry_prefill"
    );
    expect(workflowRunsService.createDirectRun).not.toHaveBeenCalled();
    expect(result.applicationId).toBe("app_retry");
  });

  it("returns the new failed run when a direct retry records failure", async () => {
    process.env.TEMPORAL_ENABLED = "false";

    const workflowRunsService = {
      getWorkflowRun: vi
        .fn()
        .mockResolvedValueOnce({
          ...failedAnalyzeRun,
          id: "run_failed_prefill_direct",
          kind: "prefill",
          applicationId: "app_failed"
        })
        .mockResolvedValueOnce({
          ...failedAnalyzeRun,
          id: "run_retry_prefill_direct",
          kind: "prefill",
          retryOfRunId: "run_failed_prefill_direct",
          applicationId: "app_retry_direct",
          status: "failed",
          errorMessage: "worker failed again"
        }),
      createDirectRun: vi.fn().mockResolvedValue({ id: "run_retry_prefill_direct" }),
      markRetried: vi.fn().mockResolvedValue({}),
      getLatestRetryRun: vi.fn().mockResolvedValue({
        ...failedAnalyzeRun,
        id: "run_retry_prefill_direct",
        kind: "prefill",
        retryOfRunId: "run_failed_prefill_direct",
        applicationId: "app_retry_direct",
        status: "failed",
        errorMessage: "worker failed again"
      })
    };

    const service = new WorkflowRunRetriesService(
      workflowRunsService as any,
      { analyzeJob: vi.fn() } as any,
      { generateResume: vi.fn() } as any,
      {
        prefillJobDirect: vi.fn().mockRejectedValue(new Error("worker failed again"))
      } as any,
      {
        executeAnalyzeJobWorkflow: vi.fn(),
        executeGenerateResumeWorkflow: vi.fn(),
        executePrefillJobWorkflow: vi.fn()
      } as any
    );

    const result = await service.retryWorkflowRun("run_failed_prefill_direct");

    expect(result.id).toBe("run_retry_prefill_direct");
    expect(result.status).toBe("failed");
    expect(workflowRunsService.getLatestRetryRun).toHaveBeenCalledWith("run_failed_prefill_direct");
  });

  it("rejects retries for runs that are not failed", async () => {
    const workflowRunsService = {
      getWorkflowRun: vi.fn().mockResolvedValue({
        ...failedAnalyzeRun,
        status: "completed"
      })
    };

    const service = new WorkflowRunRetriesService(
      workflowRunsService as any,
      { analyzeJob: vi.fn() } as any,
      { generateResume: vi.fn() } as any,
      { prefillJobDirect: vi.fn() } as any,
      {
        executeAnalyzeJobWorkflow: vi.fn(),
        executeGenerateResumeWorkflow: vi.fn(),
        executePrefillJobWorkflow: vi.fn()
      } as any
    );

    await expect(service.retryWorkflowRun("run_completed")).rejects.toBeInstanceOf(
      BadRequestException
    );
  });
});
