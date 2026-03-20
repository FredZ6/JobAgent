import { describe, expect, it } from "vitest";

import {
  jobAnalysisResultSchema,
  jobImportRequestSchema,
  workflowRunBulkActionResultSchema,
  workflowRunDetailSchema,
  workflowRunEventSchema,
  workflowRunsListQuerySchema,
  workflowRunsBulkActionRequestSchema,
  workflowRunsBulkActionResponseSchema,
  workflowRunsListResponseSchema,
  workflowRunSchema
} from "./job";

describe("job schemas", () => {
  it("accepts a valid import payload", () => {
    const result = jobImportRequestSchema.safeParse({
      sourceUrl: "https://jobs.example.com/123"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid import payload", () => {
    const result = jobImportRequestSchema.safeParse({
      sourceUrl: "not-a-url"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid analysis payload", () => {
    const result = jobAnalysisResultSchema.safeParse({
      matchScore: 82,
      summary: "Strong platform fit with one notable gap.",
      requiredSkills: ["TypeScript", "Node.js"],
      missingSkills: ["GraphQL"],
      redFlags: ["No public salary range"]
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid workflow run payload", () => {
    const result = workflowRunSchema.safeParse({
      id: "run_1",
      jobId: "job_1",
      retryOfRunId: "run_0",
      applicationId: "app_1",
      resumeVersionId: "resume_1",
      kind: "prefill",
      status: "completed",
      executionMode: "temporal",
      workflowId: "prefill-job-job_1-123",
      workflowType: "prefillJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    expect(result.success).toBe(true);
  });

  it("accepts a cancelled workflow run payload", () => {
    const result = workflowRunSchema.safeParse({
      id: "run_cancelled",
      jobId: "job_1",
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: null,
      kind: "analyze",
      status: "cancelled",
      executionMode: "temporal",
      workflowId: "analyze-job-job_1-123",
      workflowType: "analyzeJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: null,
      completedAt: new Date().toISOString(),
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid workflow run event payload", () => {
    const result = workflowRunEventSchema.safeParse({
      id: "event_1",
      workflowRunId: "run_1",
      type: "run_completed",
      payload: {
        status: "completed",
        applicationId: "app_1"
      },
      createdAt: new Date().toISOString()
    });

    expect(result.success).toBe(true);
  });

  it("accepts a workflow run detail payload with linked context", () => {
    const timestamp = new Date().toISOString();
    const result = workflowRunDetailSchema.safeParse({
      workflowRun: {
        id: "run_1",
        jobId: "job_1",
        retryOfRunId: "run_0",
        applicationId: "app_1",
        resumeVersionId: "resume_1",
        kind: "prefill",
        status: "completed",
        executionMode: "temporal",
        workflowId: "prefill-job-job_1-123",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis",
        startedAt: timestamp,
        completedAt: timestamp,
        errorMessage: null,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      job: {
        id: "job_1",
        title: "Staff Platform Engineer",
        company: "Rolecraft"
      },
      application: {
        id: "app_1",
        status: "completed",
        approvalStatus: "pending_review",
        submissionStatus: "ready_to_submit",
        createdAt: timestamp
      },
      resumeVersion: {
        id: "resume_1",
        headline: "Staff Platform Engineer",
        status: "completed"
      },
      retryOfRun: {
        id: "run_0",
        jobId: "job_1",
        retryOfRunId: null,
        applicationId: null,
        resumeVersionId: null,
        kind: "prefill",
        status: "failed",
        executionMode: "direct",
        workflowId: null,
        workflowType: null,
        taskQueue: null,
        startedAt: timestamp,
        completedAt: timestamp,
        errorMessage: "prefill failed",
        createdAt: timestamp,
        updatedAt: timestamp
      },
      latestRetry: null
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid global workflow-runs list query payload", () => {
    const result = workflowRunsListQuerySchema.safeParse({
      kind: "prefill",
      status: "failed",
      executionMode: "temporal",
      q: "staff platform engineer",
      from: "2026-03-17",
      to: "2026-03-18",
      sortBy: "completedAt",
      sortOrder: "asc",
      cursor: "run_1",
      limit: 25
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown workflow-runs sort field", () => {
    const result = workflowRunsListQuerySchema.safeParse({
      sortBy: "updatedAt"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a workflow-runs list response with summary and linked rows", () => {
    const timestamp = new Date().toISOString();
    const result = workflowRunsListResponseSchema.safeParse({
      summary: {
        totalRuns: 2,
        queuedRuns: 0,
        runningRuns: 0,
        completedRuns: 1,
        failedRuns: 1,
        cancelledRuns: 0
      },
      pageInfo: {
        nextCursor: "run_1",
        hasMore: true,
        returnedCount: 1
      },
      runs: [
        {
          workflowRun: {
            id: "run_1",
            jobId: "job_1",
            retryOfRunId: null,
            applicationId: "app_1",
            resumeVersionId: null,
            kind: "prefill",
            status: "failed",
            executionMode: "direct",
            workflowId: null,
            workflowType: null,
            taskQueue: null,
            startedAt: timestamp,
            completedAt: timestamp,
            errorMessage: "worker failed",
            createdAt: timestamp,
            updatedAt: timestamp
          },
          job: {
            id: "job_1",
            title: "Staff Platform Engineer",
            company: "Rolecraft"
          },
          application: {
            id: "app_1",
            status: "failed"
          },
          resumeVersion: null
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid workflow-runs bulk action request payload", () => {
    const result = workflowRunsBulkActionRequestSchema.safeParse({
      runIds: ["run_1", "run_2", "run_3"]
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty workflow-runs bulk action request payload", () => {
    const result = workflowRunsBulkActionRequestSchema.safeParse({
      runIds: []
    });

    expect(result.success).toBe(false);
  });

  it("accepts a workflow-runs bulk action response payload", () => {
    const timestamp = new Date().toISOString();
    const row = {
      workflowRun: {
        id: "run_retry",
        jobId: "job_1",
        retryOfRunId: "run_failed",
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
        id: "job_1",
        title: "Staff Platform Engineer",
        company: "Rolecraft"
      },
      application: null,
      resumeVersion: null,
      retryOfRun: null,
      latestRetry: null
    };

    expect(workflowRunBulkActionResultSchema.safeParse({
      runId: "run_failed",
      status: "success",
      message: "Retried successfully.",
      workflowRun: row
    }).success).toBe(true);

    expect(
      workflowRunsBulkActionResponseSchema.safeParse({
        requestedCount: 3,
        eligibleCount: 2,
        skippedCount: 1,
        successCount: 2,
        failureCount: 0,
        results: [
          {
            runId: "run_failed",
            status: "success",
            message: "Retried successfully.",
            workflowRun: row
          },
          {
            runId: "run_completed",
            status: "skipped",
            message: "Only failed workflow runs can be retried.",
            workflowRun: null
          }
        ]
      }).success
    ).toBe(true);
  });

  it("requires pageInfo on workflow-runs list responses", () => {
    const timestamp = new Date().toISOString();
    const result = workflowRunsListResponseSchema.safeParse({
      summary: {
        totalRuns: 1,
        queuedRuns: 0,
        runningRuns: 0,
        completedRuns: 1,
        failedRuns: 0,
        cancelledRuns: 0
      },
      runs: [
        {
          workflowRun: {
            id: "run_1",
            jobId: "job_1",
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
            id: "job_1",
            title: "Staff Platform Engineer",
            company: "Rolecraft"
          },
          application: null,
          resumeVersion: null
        }
      ]
    });

    expect(result.success).toBe(false);
  });
});
